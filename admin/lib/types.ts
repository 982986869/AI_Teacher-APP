export type AdminRole = 'super_admin' | 'admin' | 'content_manager' | 'support'

export type Permission =
  | 'dashboard.view'
  | 'users.view' | 'users.edit' | 'users.delete' | 'users.role' | 'users.password'
  | 'admins.manage'
  | 'content.view' | 'content.edit' | 'content.publish'
  | 'reports.view'
  | 'aiteacher.view' | 'aiteacher.edit'
  | 'announcements.view' | 'announcements.edit'
  | 'settings.view' | 'settings.edit'
  | 'flags.view' | 'flags.edit'
  | 'audit.view'

export interface Admin {
  id: string
  name: string
  email: string
  role: AdminRole
  roleLabel: string
  permissions: Permission[]
}

export interface Paged<T> {
  rows: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UserRow {
  id: string
  name: string
  email: string | null
  phone: string | null
  grade: string | null
  board: string | null
  stream: string | null
  accountType: string
  role: string
  adminRole: AdminRole | null
  isActive: boolean
  linkedStudentId: string | null
  createdAt: string
}

export interface SubjectStat { subject: string; attempts: number; avgScore: number }
export interface TrendPoint { date: string; count: number }
export interface ActivityItem {
  id: string
  type: 'signup' | 'lesson_completed' | 'mock_submitted' | 'braingym_completed' | 'admin_action'
  title: string | null
  subtitle: string | null
  actor: string | null
  at: string
  meta: string | null
}

export interface DashboardData {
  generatedAt: string
  overview: {
    totalStudents: number; activeToday: number; activeThisWeek: number
    parents: number; teachers: number; admins: number
    newRegistrationsToday: number; newRegistrationsWeek: number; returningUsers: number
  }
  aiTeacher: {
    lessonsGeneratedToday: number; lessonsCompleted: number; lessonsCompletedToday: number
    averageCompletion: number | null; doubtsAsked: number; doubtsToday: number
    aiFailures: number; avgGenerationMs: number; pendingReview: number
  }
  brainGym: {
    sessionsToday: number; questionsGenerated: number; questionsGeneratedToday: number
    questionsAccepted: number; questionsRejected: number
    averageAccuracy: number | null; activeStreakUsers: number
  }
  practice: {
    practiceAttempts: number; practiceToday: number; mockAttempts: number; mockToday: number
    averageScore: number | null; mostAttemptedSubject: SubjectStat | null; lowestPerformingSubject: SubjectStat | null
  }
  arena: {
    matchesToday: number; activePlayers: number; abandonedMatches: number; abandonedToday: number
    ratingDistribution: { label: string; count: number }[]
  }
  content: {
    subjects: number; chapters: number; notes: number; mcqs: number; mockTests: number
    resources: number; missingContent: number; draftContent: number | null; publishedContent: number | null
  }
  activity: ActivityItem[]
  platform: {
    api: string; database: string; backgroundJobs: string | null; lastBackup: string | null
    serverTime: string; version: string; environment: string; node: string
  }
  trends: { signups: TrendPoint[]; activeUsers: TrendPoint[] }
}

export interface Announcement {
  id: string; title: string; body: string; audience: string; classLevel: number | null
  status: 'draft' | 'published' | 'archived'; pinned: boolean
  startsAt: string | null; endsAt: string | null; createdByName: string | null
  publishedAt: string | null; createdAt: string; updatedAt: string
}

export interface Setting {
  key: string; value: any; category: string; label: string | null; description: string | null; version: number; updatedAt: string
}

export interface FeatureFlag {
  key: string
  label: string
  description: string | null
  enabled: boolean
  environment: 'all' | 'production' | 'development'
  rolloutScope: string
  version: number
  updatedByName: string | null
  updatedAt: string
}

export interface AnalyticsSummary {
  totalStudents: number; totalParents: number; totalTeachers: number
  activeToday: number; activeThisWeek: number; activeThisMonth: number
  newRegistrations: number; newToday: number
  lessonCompletionRate: number | null; lessonsCompleted: number
  brainGymSessions: number; brainGymAccuracy: number | null
  practiceAttempts: number; aiTeacherSessions: number; doubtsAsked: number
  avgSessionDuration: number; weeklyEngagement: number | null; monthlyEngagement: number | null
}
export interface TrendPointV { date: string; value: number }
export interface AnalyticsTrends {
  dailyActiveUsers: TrendPointV[]; weeklyActiveUsers: TrendPointV[]; lessonCompletion: TrendPointV[]
  brainGym: TrendPointV[]; practice: TrendPointV[]; aiTeacher: TrendPointV[]; parentEngagement: TrendPointV[]
}
export interface AnalyticsTop {
  topStudents: { id: string; name: string; grade: string | null; xp: number; sessions: number; accuracy: number | null }[]
  studentsAtRisk: { id: string; name: string; grade: string | null; accuracy: number | null; openMistakes: number; sessions: number }[]
  weakSubjects: { subject: string; mistakes: number; students: number }[]
  weakChapters: { subject: string; chapter: string; mistakes: number; students: number }[]
  mostUsedLessons: { title: string; subject: string; count: number }[]
  mostUsedBrainGym: { activity: string; count: number; accuracy: number }[]
}
export interface AnalyticsActivity {
  recentSignups: { id: string; name: string; detail: string | null; grade: string | null; at: string }[]
  recentLessons: { id: string; title: string; student: string; at: string }[]
  recentAiTeacher: { id: string; title: string; subject: string; student: string; status: string; at: string }[]
  recentParents: { id: string; name: string; detail: string | null; linked: boolean; at: string }[]
}
export interface AnalyticsFacets { classes: string[]; boards: string[]; schools: string[]; subjects: string[] }

export interface ParentRow {
  id: string; name: string; email: string | null; phone: string | null
  isActive: boolean; createdAt: string
  childId: string | null; childName: string | null; childGrade: string | null
}

export interface ParentDetailData {
  parent: { id: string; name: string; email: string | null; phone: string | null; isActive: boolean; language: string | null; school: string | null; linkedStudentId: string | null; createdAt: string }
  child: { id: string; name: string; email: string | null; phone: string | null; grade: string | null; board: string | null; stream: string | null; isActive: boolean; createdAt: string } | null
  snapshot: { progress: { brainGymPlays: number; xp: number; accuracy: number | null; lessons: number; openMistakes: number; totalMistakes: number; practiceAttempts: number }; recentActivity: { type: string; subject: string | null; chapter: string | null; at: string }[] } | null
}

export type CmsLevel = 'board' | 'class' | 'subject' | 'chapter' | 'topic' | 'lesson'
export type CmsStatus = 'draft' | 'review' | 'published' | 'archived' | 'rejected'

export interface CmsNode {
  id: string
  parentId: string | null
  level: CmsLevel
  name: string
  slug: string
  description: string
  position: number
  status: CmsStatus
  icon: string | null
  coverImage: string | null
  estimatedDuration: number | null
  difficulty: 'easy' | 'medium' | 'hard' | null
  tags: string[]
  visibility: string
  version: number
  lockVersion: number
  createdByName: string | null
  updatedByName: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  childCount?: number
}

export interface CmsVersion {
  id: string; version: number; status: string; editorName: string | null
  changeSummary: string; publishedAt: string | null; createdAt: string
}

export interface AuditEntry {
  id: string; actorId: string | null; actorName: string | null; actorEmail: string | null
  actorRole: string | null; module: string; action: string; targetType: string | null
  targetId: string | null; targetLabel: string | null; before: any; after: any; ip: string | null; createdAt: string
}
