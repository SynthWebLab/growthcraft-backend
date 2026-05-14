import { ICourse } from '@/database/models/Course.model';
import { ICourseModule } from '@/database/models/CourseModule.model';
import { ICourseFAQ } from '@/database/models/CourseFAQ.model';
import { ICourseBatch } from '@/database/models/CourseBatch.model';

export interface ICourseDetail {
  course: ICourse;
  modules: ICourseModule[];
  faqs: ICourseFAQ[];
  upcomingBatches: ICourseBatch[];
}

export interface IBootcampDetail {
  bootcamp: any; // Will use IBootcamp type
  modules?: ICourseModule[];
  faqs?: ICourseFAQ[];
}
