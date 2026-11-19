import { useEffect, useState } from 'react';
import type { UserProfile } from './auth.types.js';
import { getInitials } from './profile.js';

interface UserAvatarProps {
  size?: 'small' | 'large';
  user: UserProfile;
}

export function UserAvatar({ size = 'small', user }: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [user.avatarUrl]);

  return (
    <span className={`avatar avatar--${size}`} aria-hidden="true">
      {user.avatarUrl && !imageFailed ? (
        <img
          src={user.avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        getInitials(user.name)
      )}
    </span>
  );
}
