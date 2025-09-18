import React from 'react';
import { makePublicUrlFromKey } from '../utils/s3PublicUrl';
import { formatIST } from '../utils/datetime';
import { renderStars } from '../utils/reviewUtils';
import { Award } from 'lucide-react'; // Added for the doctor's icon

const ReviewCard = ({ r }) => {
  const name = r?.user?.name || 'Anonymous Patient';
  const avatar = makePublicUrlFromKey(r?.user?.profilePicture);
  const created = r?.createdAt ? formatIST(r.createdAt, 'DD MMM YYYY') : '';
  
  const doctorName = r?.doctor?.name || 'The Doctor';
  const doctorAvatar = makePublicUrlFromKey(r?.doctor?.profilePicture);
  const repliedAt = r?.doctor_reply?.repliedAt
    ? formatIST(r.doctor_reply.repliedAt, 'DD MMM YYYY')
    : '';

  return (
    <article className="w-full rounded-xl border border-gray-200 bg-white p-4 transition-shadow duration-300 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <img
            src={avatar}
            alt={name}
            className="h-12 w-12 flex-shrink-0 rounded-full object-cover ring-1 ring-gray-100"
            loading="lazy"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-800">{name}</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              {renderStars(r.rating)}
              <span className="hidden sm:inline text-gray-300">•</span>
              <time className="hidden sm:inline shrink-0">{created}</time>
            </div>
          </div>
        </div>
        <time className="sm:hidden text-xs text-gray-500 shrink-0 pt-1">{created}</time>
      </div>

      {r.comment && (
        <p className="mt-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
          {r.comment}
        </p>
      )}

      {r.doctor_reply?.text && (
        <div className="mt-4 rounded-lg bg-indigo-50/50 p-4 border border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={doctorAvatar}
              alt={doctorName}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-indigo-200"
            />
            <div className="text-xs font-semibold text-indigo-700">
              Dr. {doctorName}
              <span className="text-indigo-300 font-normal mx-2">•</span>
              <span className="font-normal text-indigo-600">{repliedAt}</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
            {r.doctor_reply.text}
          </p>
        </div>
      )}
    </article>
  );
};

export default ReviewCard;