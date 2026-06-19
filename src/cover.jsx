import React from 'react';

const Cover = ({ coverUrl = '', fallback = '', lg = false }) => {
  const [imgFailed, setImgFailed] = React.useState(false);
  const cls = lg ? 'cover lg' : 'cover';
  const initials = (fallback || '').slice(0, 2);

  if (coverUrl && !imgFailed) {
    return (
      <div className={cls}>
        <img src={coverUrl} alt="" onError={() => setImgFailed(true)} />
      </div>
    );
  }

  return (
    <div className={cls}>
      <div className="vinyl-stripes"></div>
      <span style={{ position: 'relative' }}>{initials}</span>
    </div>
  );
};

export { Cover };
export default Cover;
