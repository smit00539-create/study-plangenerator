import { StudyPlan, Subject, Chapter, DayPlan, GeneratedSchedule } from "@/types/studyPlan";

interface SubjectQueue {
  id: string;
  name: string;
  weight: number;
  chapters: Chapter[];
  remaining: number;
}

export function generateSchedule(plan: StudyPlan): GeneratedSchedule {
  // Step 1: Sanity & totals
  const totalLectures = plan.subjects.reduce((sum, subject) => 
    sum + subject.chapters.reduce((chapterSum, chapter) => chapterSum + chapter.lectures_remaining, 0), 0
  );

  if (totalLectures === 0) {
    throw new Error("Please add chapters with lectures to schedule.");
  }

  // Step 2: Prepare per-subject queues
  const subjectQueues: SubjectQueue[] = plan.subjects.map(subject => ({
    id: subject.id,
    name: subject.name,
    weight: plan.distribution_mode === "auto" ? 
      subject.preference_weight * subject.chapters.reduce((sum, ch) => sum + ch.lectures_remaining, 0) :
      subject.preference_weight,
    chapters: [...subject.chapters],
    remaining: subject.chapters.reduce((sum, chapter) => sum + chapter.lectures_remaining, 0)
  })).filter(queue => queue.remaining > 0);

  // Step 3: Decide pair rotation
  const pairCycle = generatePairCycle(subjectQueues, plan.rotation_enabled);
  
  // Step 4: Daily allocation
  const days: DayPlan[] = [];
  let currentPairIndex = 0;
  let totalRemainingLectures = totalLectures;

  for (let dayNum = 1; dayNum <= plan.duration_days && totalRemainingLectures > 0; dayNum++) {
    const dayPlan = allocateDay(
      dayNum,
      subjectQueues,
      pairCycle,
      currentPairIndex,
      plan,
      plan.start_date
    );
    
    days.push(dayPlan);
    
    // Update remaining counts
    dayPlan.lectures.forEach(lecture => {
      const queue = subjectQueues.find(q => q.name === lecture.subject);
      if (queue) {
        queue.remaining -= lecture.count;
        totalRemainingLectures -= lecture.count;
      }
    });

    // Move to next pair in cycle
    if (plan.rotation_enabled && pairCycle.length > 0) {
      currentPairIndex = (currentPairIndex + 1) % pairCycle.length;
    }
  }

  // Add buffer days if completed early
  const completionDay = days.findIndex(day => 
    subjectQueues.every(queue => queue.remaining <= 0)
  ) + 1;

  const bufferDays = Math.max(0, plan.duration_days - completionDay);

  // Generate summary
  const lecturesPerSubject: Record<string, number> = {};
  plan.subjects.forEach(subject => {
    lecturesPerSubject[subject.name] = subject.chapters.reduce(
      (sum, chapter) => sum + chapter.lectures_remaining, 0
    );
  });

  return {
    days,
    summary: {
      total_lectures: totalLectures,
      lectures_per_subject: lecturesPerSubject,
      completion_day: completionDay || plan.duration_days,
      buffer_days: bufferDays
    }
  };
}

function generatePairCycle(queues: SubjectQueue[], rotationEnabled: boolean): string[][] {
  if (!rotationEnabled || queues.length < 2) {
    return [];
  }

  if (queues.length === 2) {
    return [[queues[0].name, queues[1].name]];
  }

  // Generate round-robin pairs for 3+ subjects
  const pairs: string[][] = [];
  const subjects = queues.map(q => q.name);
  
  for (let i = 0; i < subjects.length; i++) {
    for (let j = i + 1; j < subjects.length; j++) {
      pairs.push([subjects[i], subjects[j]]);
    }
  }

  return pairs;
}

function allocateDay(
  dayNum: number,
  queues: SubjectQueue[],
  pairCycle: string[][],
  pairIndex: number,
  plan: StudyPlan,
  startDate?: string
): DayPlan {
  const availableQueues = queues.filter(q => q.remaining > 0);
  
  if (availableQueues.length === 0) {
    return {
      day: dayNum,
      date: calculateDate(startDate, dayNum),
      subjects: [],
      lectures: [],
      revisions: [],
      practice_note: "Catch-up / Revision / Light practice"
    };
  }

  // Pick subject pair
  let pair: string[];
  if (plan.rotation_enabled && pairCycle.length > 0) {
    pair = pairCycle[pairIndex];
    // Ensure both subjects in pair are still available
    const availableInPair = pair.filter(subjectName => 
      availableQueues.some(q => q.name === subjectName)
    );
    if (availableInPair.length < 2) {
      // Fall back to greedy selection
      pair = selectGreedyPair(availableQueues);
    }
  } else {
    pair = selectGreedyPair(availableQueues);
  }

  const queue1 = queues.find(q => q.name === pair[0]);
  const queue2 = queues.find(q => q.name === pair[1]);

  if (!queue1 || !queue2) {
    return {
      day: dayNum,
      date: calculateDate(startDate, dayNum),
      subjects: [],
      lectures: [],
      revisions: [],
      practice_note: "Catch-up / Revision"
    };
  }

  // Calculate available capacity
  const availableCapacity = Math.min(
    plan.max_lectures_per_day,
    queue1.remaining + queue2.remaining
  );

  // Compute weighted shares
  const w1 = queue1.weight * queue1.remaining;
  const w2 = queue2.weight * queue2.remaining;
  const totalWeight = w1 + w2;

  if (totalWeight === 0) {
    return {
      day: dayNum,
      date: calculateDate(startDate, dayNum),
      subjects: [pair[0], pair[1]],
      lectures: [],
      revisions: [],
      practice_note: "Review and practice"
    };
  }

  // Desired allocation
  let alloc1 = Math.round(availableCapacity * (w1 / totalWeight));
  let alloc2 = availableCapacity - alloc1;

  // Enforce lower bounds
  if (alloc1 === 0 && queue1.remaining > 0 && alloc2 < availableCapacity) {
    alloc1 = 1;
    alloc2 = availableCapacity - 1;
  }
  if (alloc2 === 0 && queue2.remaining > 0 && alloc1 < availableCapacity) {
    alloc2 = 1;
    alloc1 = availableCapacity - 1;
  }

  // Cap to remaining lectures
  alloc1 = Math.min(alloc1, queue1.remaining);
  alloc2 = Math.min(alloc2, queue2.remaining);

  // Assign lectures from chapter queues
  const lectures = [
    ...assignLecturesFromQueue(queue1, alloc1),
    ...assignLecturesFromQueue(queue2, alloc2)
  ];

  return {
    day: dayNum,
    date: calculateDate(startDate, dayNum),
    subjects: [pair[0], pair[1]],
    lectures,
    revisions: [],
    practice_note: "Do 10–20% time for practice"
  };
}

function selectGreedyPair(queues: SubjectQueue[]): string[] {
  if (queues.length === 0) return [];
  if (queues.length === 1) return [queues[0].name];
  
  // Sort by weight * remaining (descending)
  const sorted = [...queues].sort((a, b) => (b.weight * b.remaining) - (a.weight * a.remaining));
  return [sorted[0].name, sorted[1].name];
}

function assignLecturesFromQueue(queue: SubjectQueue, allocation: number): Array<{subject: string, chapter: string, count: number}> {
  const assignments: Array<{subject: string, chapter: string, count: number}> = [];
  let remaining = allocation;

  while (remaining > 0 && queue.chapters.length > 0) {
    const chapter = queue.chapters[0];
    const toAssign = Math.min(remaining, chapter.lectures_remaining);
    
    if (toAssign > 0) {
      assignments.push({
        subject: queue.name,
        chapter: chapter.name,
        count: toAssign
      });
      
      chapter.lectures_remaining -= toAssign;
      remaining -= toAssign;
      
      if (chapter.lectures_remaining === 0) {
        queue.chapters.shift(); // Remove completed chapter
      }
    } else {
      break;
    }
  }

  return assignments;
}

function calculateDate(startDate: string | undefined, dayNum: number): string | undefined {
  if (!startDate) return undefined;
  
  const start = new Date(startDate);
  const target = new Date(start);
  target.setDate(start.getDate() + dayNum - 1);
  
  return target.toISOString().split('T')[0];
}