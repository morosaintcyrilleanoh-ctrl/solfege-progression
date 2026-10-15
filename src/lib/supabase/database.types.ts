/**
 * Types de la base de données (correspondant à supabase/migrations).
 * Peut être régénéré avec : npx supabase gen types typescript --project-id <id>
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = 'admin' | 'trainer' | 'student';
export type LearnerLevelDb = 'debutant' | 'intermediaire' | 'avance';
export type PublicationStatus = 'draft' | 'published';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

type Table<Row, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  role: AppRole;
  level: LearnerLevelDb;
  instrument: string | null;
  musical_background: string | null;
  goals: string | null;
  country: string | null;
  weekly_goal: number;
  placement: Json | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CourseRow = {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  description: string;
  level: LearnerLevelDb;
  status: PublicationStatus;
  is_open: boolean;
  position: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ModuleRow = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  position: number;
  status: PublicationStatus;
  required_level: LearnerLevelDb;
  created_at: string;
  updated_at: string;
};

export type LessonRow = {
  id: string;
  module_id: string;
  title: string;
  summary: string;
  content: string;
  video_url: string | null;
  duration_minutes: number | null;
  position: number;
  status: PublicationStatus;
  created_at: string;
  updated_at: string;
};

export type LessonResourceRow = {
  id: string;
  lesson_id: string;
  title: string;
  kind: 'pdf' | 'audio' | 'video' | 'image' | 'document' | 'link';
  storage_path: string | null;
  external_url: string | null;
  size_bytes: number | null;
  downloadable: boolean;
  position: number;
  created_at: string;
};

export type ExerciseRow = {
  id: string;
  owner_id: string;
  course_id: string | null;
  lesson_id: string | null;
  title: string;
  description: string;
  kind: 'practice' | 'assessment';
  max_attempts: number | null;
  status: PublicationStatus;
  created_at: string;
  updated_at: string;
};

export type ExerciseQuestionRow = {
  id: string;
  exercise_id: string;
  position: number;
  type: 'mcq' | 'short' | 'match';
  skill: string;
  prompt: string;
  notation: Json | null;
  choices: Json | null;
  answer_kind: 'text' | 'number' | null;
  created_at: string;
};

export type ExerciseQuestionKeyRow = {
  question_id: string;
  correct: Json;
  explanation: string;
};

export type EnrollmentRow = {
  id: string;
  course_id: string;
  user_id: string;
  status: 'active' | 'completed' | 'suspended';
  enrolled_by: string | null;
  enrolled_at: string;
};

export type GroupRow = {
  id: string;
  trainer_id: string;
  name: string;
  description: string;
  created_at: string;
};

export type GroupMemberRow = {
  group_id: string;
  user_id: string;
  added_at: string;
};

export type ExerciseAttemptRow = {
  id: string;
  user_id: string;
  source: 'lab' | 'exercise' | 'placement';
  exercise_id: string | null;
  assignment_id: string | null;
  lab_id: string | null;
  mode: 'training' | 'evaluation';
  score: number;
  max_score: number;
  details: Json | null;
  client_session_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type LearningProgressRow = {
  user_id: string;
  lesson_id: string;
  status: ProgressStatus;
  progress_percent: number;
  last_position: Json | null;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
};

export type ModuleUnlockRow = {
  id: string;
  student_id: string;
  module_id: string | null;
  lab_key: 'intervalles' | null;
  unlocked_by: string | null;
  created_at: string;
};

export type AssignmentRow = {
  id: string;
  created_by: string;
  title: string;
  instructions: string;
  group_id: string | null;
  student_id: string | null;
  course_id: string | null;
  lesson_id: string | null;
  exercise_id: string | null;
  due_at: string | null;
  status: PublicationStatus;
  created_at: string;
  updated_at: string;
};

export type SubmissionRow = {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string;
  attachment_path: string | null;
  attempt_id: string | null;
  status: 'submitted' | 'reviewed' | 'returned';
  score: number | null;
  feedback: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  updated_at: string;
};

export type LiveSessionRow = {
  id: string;
  trainer_id: string;
  title: string;
  description: string;
  starts_at: string;
  duration_minutes: number;
  meeting_url: string | null;
  replay_url: string | null;
  replay_path: string | null;
  audience: 'all' | 'course' | 'group';
  course_id: string | null;
  group_id: string | null;
  status: 'scheduled' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
};

export type AnnouncementRow = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  audience: 'all' | 'course' | 'group';
  course_id: string | null;
  group_id: string | null;
  status: PublicationStatus;
  published_at: string | null;
  created_at: string;
};

export type CommentRow = {
  id: string;
  student_id: string;
  author_id: string;
  body: string;
  context: string | null;
  created_at: string;
};

export type SettingRow = {
  key: string;
  value: Json;
  updated_by: string | null;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, 'id'>;
      courses: Table<CourseRow, 'owner_id' | 'title' | 'slug'>;
      modules: Table<ModuleRow, 'course_id' | 'title'>;
      lessons: Table<LessonRow, 'module_id' | 'title'>;
      lesson_resources: Table<LessonResourceRow, 'lesson_id' | 'title' | 'kind'>;
      exercises: Table<ExerciseRow, 'owner_id' | 'title'>;
      exercise_questions: Table<ExerciseQuestionRow, 'exercise_id' | 'type' | 'prompt'>;
      exercise_question_keys: Table<ExerciseQuestionKeyRow, 'question_id' | 'correct'>;
      enrollments: Table<EnrollmentRow, 'course_id' | 'user_id'>;
      groups: Table<GroupRow, 'trainer_id' | 'name'>;
      group_members: Table<GroupMemberRow, 'group_id' | 'user_id'>;
      exercise_attempts: Table<ExerciseAttemptRow, 'user_id' | 'source' | 'score' | 'max_score'>;
      learning_progress: Table<LearningProgressRow, 'user_id' | 'lesson_id'>;
      module_unlocks: Table<ModuleUnlockRow, 'student_id'>;
      assignments: Table<AssignmentRow, 'created_by' | 'title'>;
      assignment_submissions: Table<SubmissionRow, 'assignment_id' | 'student_id'>;
      live_sessions: Table<LiveSessionRow, 'trainer_id' | 'title' | 'starts_at'>;
      announcements: Table<AnnouncementRow, 'author_id' | 'title' | 'body'>;
      pedagogical_comments: Table<CommentRow, 'student_id' | 'author_id' | 'body'>;
      platform_settings: Table<SettingRow, 'key' | 'value'>;
    };
    Views: { [_ in never]: never };
    Functions: {
      submit_exercise_attempt: { Args: { p_exercise_id: string; p_answers: Json; p_assignment_id?: string | null }; Returns: Json };
      set_user_role: { Args: { p_user: string; p_role: AppRole }; Returns: undefined };
      set_user_active: { Args: { p_user: string; p_active: boolean }; Returns: undefined };
      set_student_level: { Args: { p_student: string; p_level: LearnerLevelDb }; Returns: undefined };
      record_placement: { Args: { p_level: LearnerLevelDb; p_scores: Json; p_client_session?: string | null }; Returns: undefined };
      add_student_to_group: { Args: { p_group: string; p_email: string }; Returns: string };
      enroll_student: { Args: { p_course: string; p_email: string }; Returns: string };
      enroll_group: { Args: { p_course: string; p_group: string }; Returns: number };
      admin_overview: { Args: never; Returns: Json };
      admin_list_users: {
        Args: { p_search?: string; p_role?: AppRole | null; p_limit?: number; p_offset?: number };
        Returns: { id: string; email: string; first_name: string; last_name: string; role: AppRole; level: LearnerLevelDb; is_active: boolean; created_at: string; total: number }[];
      };
    };
    Enums: {
      app_role: AppRole;
      learner_level: LearnerLevelDb;
      publication_status: PublicationStatus;
      progress_status: ProgressStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
