import { redirect } from 'next/navigation';
import { currentMonth } from '@/lib/date';

/*
 * /log is whichever month is running now.
 *
 * force-dynamic is load-bearing: prerendered, this redirect would freeze the
 * month it was built in and send every visit there until the next deploy.
 */
export const dynamic = 'force-dynamic';

export default function LogIndex() {
  redirect(`/log/${currentMonth()}`);
}
