'use client';
import { useState } from 'react';

export default function Gallery({ images }) {
  const [open, setOpen] = useState(null);
  if (!images.length) return null;
  return (
    <>
      <div className="gallery">
        {images.map((img) => (
          <img key={img.id} src={img.url} alt={img.caption_tr || ''} onClick={() => setOpen(img)} />
        ))}
      </div>
      {open && (
        <div onClick={() => setOpen(null)}
          style={{ position:'fixed', inset:0, background:'rgba(4,10,18,.94)', zIndex:50,
                   display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <img src={open.url} alt="" style={{ maxWidth:'100%', maxHeight:'88vh', borderRadius:12 }} />
        </div>
      )}
    </>
  );
}
