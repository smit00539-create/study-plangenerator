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
      customFactors: [],
      practice_note: "Catch-up / Revision / Light practice"
    };
  }

  // Select subjects for this day based on subjects_per_day setting
  const subjectsPerDay = Math.min(plan.subjects_per_day || 2, availableQueues.length);
  let selectedSubjects: string[];

  if (subjectsPerDay === 2 && plan.rotation_enabled && pairCycle.length > 0) {
    // Use pair rotation for 2 subjects per day with rotation enabled
    selectedSubjects = pairCycle[pairIndex];
    // Ensure selected subjects are still available
    const availableSelected = selectedSubjects.filter(subjectName => 
      availableQueues.some(q => q.name === subjectName)
    );
    if (availableSelected.length < subjectsPerDay) {
      // Fall back to greedy selection
      selectedSubjects = selectTopSubjects(availableQueues, subjectsPerDay);
    }
  } else {
    // Use greedy selection based on weight and remaining lectures
    selectedSubjects = selectTopSubjects(availableQueues, subjectsPerDay);
  }

  // Get queues for selected subjects
  const selectedQueues = selectedSubjects
    .map(name => queues.find(q => q.name === name))
    .filter((q): q is SubjectQueue => q !== undefined && q.remaining > 0);

  if (selectedQueues.length === 0) {
    return {
      day: dayNum,
      date: calculateDate(startDate, dayNum),
      subjects: [],
      lectures: [],
      revisions: [],
      customFactors: [],
      practice_note: "Catch-up / Revision"
    };
  }

  // Calculate total remaining for selected subjects
  const totalRemaining = selectedQueues.reduce((sum, q) => sum + q.remaining, 0);
  
  // Calculate available capacity
  const availableCapacity = Math.min(plan.max_lectures_per_day, totalRemaining);

  // Compute weighted shares for each selected subject
  const weights = selectedQueues.map(q => q.weight * q.remaining);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  if (totalWeight === 0) {
    return {
      day: dayNum,
      date: calculateDate(startDate, dayNum),
      subjects: selectedSubjects,
      lectures: [],
      revisions: [],
      customFactors: [],
      practice_note: "Review and practice"
    };
  }

  // Allocate lectures to each subject based on weighted shares
  const allocations = selectedQueues.map((queue, index) => {
    const share = weights[index] / totalWeight;
    return Math.round(availableCapacity * share);
  });

  // Ensure total allocation doesn't exceed capacity
  let totalAllocation = allocations.reduce((sum, a) => sum + a, 0);
  if (totalAllocation > availableCapacity) {
    // Reduce from highest allocation
    const maxIndex = allocations.indexOf(Math.max(...allocations));
    allocations[maxIndex] -= (totalAllocation - availableCapacity);
  } else if (totalAllocation < availableCapacity) {
    // Add to highest weight subject
    const maxIndex = allocations.indexOf(Math.max(...allocations));
    allocations[maxIndex] += (availableCapacity - totalAllocation);
  }

  // Ensure each subject gets at least 1 lecture if possible
  for (let i = 0; i < allocations.length; i++) {
    if (allocations[i] === 0 && selectedQueues[i].remaining > 0) {
      // Try to take from other subjects
      for (let j = 0; j < allocations.length; j++) {
        if (i !== j && allocations[j] > 1) {
          allocations[i] = 1;
          allocations[j] -= 1;
          break;
        }
      }
    }
  }

  // Cap allocations to remaining lectures
  for (let i = 0; i < allocations.length; i++) {
    allocations[i] = Math.min(allocations[i], selectedQueues[i].remaining);
  }

  // Assign lectures from chapter queues
  const lectures = selectedQueues.flatMap((queue, index) => 
    assignLecturesFromQueue(queue, allocations[index])
  );

  // Assign revisions if available
  const revisions: Array<{subject: string, revision: string}> = [];
  selectedQueues.forEach(queue => {
    const subject = plan.subjects.find(s => s.name === queue.name);
    if (subject && subject.revisions.length > 0) {
      // Add one revision topic per subject if available
      const revision = subject.revisions[dayNum % subject.revisions.length];
      if (revision) {
        revisions.push({
          subject: subject.name,
          revision: revision.name
        });
      }
    }
  });

  // Assign custom factors for the subjects
  const customFactors: Array<{subject: string, factorType: string, factorName: string, value: string}> = [];
  selectedQueues.forEach(queue => {
    const subject = plan.subjects.find(s => s.name === queue.name);
    if (subject && subject.customFactorTypes.length > 0) {
      subject.customFactorTypes.forEach(factorType => {
        factorType.items.forEach(item => {
          if (item.value.trim()) {
            customFactors.push({
              subject: subject.name,
              factorType: factorType.typeName,
              factorName: item.name,
              value: item.value
            });
          }
        });
      });
    }
  });

  return {
    day: dayNum,
    date: calculateDate(startDate, dayNum),
    subjects: selectedSubjects,
    lectures,
    revisions,
    customFactors: customFactors,
    practice_note: "Do 10–20% time for practice"
  };
}

function selectTopSubjects(queues: SubjectQueue[], count: number): string[] {
  if (queues.length === 0) return [];
  
  // Sort by weight * remaining (descending)
  const sorted = [...queues].sort((a, b) => (b.weight * b.remaining) - (a.weight * a.remaining));
  return sorted.slice(0, Math.min(count, sorted.length)).map(q => q.name);
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