// utils/scrollLock.js
let count = 0;
let prevBodyOverflow = '';

export function lockBodyScroll() {
  if (count === 0) {
    prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  count += 1;
}

export function unlockBodyScroll(force = false) {
  if (force) {
    count = 0;
  } else {
    count = Math.max(0, count - 1);
  }
  if (count === 0) {
    document.body.style.overflow = prevBodyOverflow || '';
  }
}

// optional: belt-and-suspenders reset
export function hardResetBodyScroll() {
  count = 0;
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  document.body.classList.remove('overflow-hidden', 'modal-open');
}
