import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const formatIST = (date, fmt = 'DD MMM YYYY, h:mm A') =>
  dayjs.utc(date).tz('Asia/Kolkata').format(fmt);
