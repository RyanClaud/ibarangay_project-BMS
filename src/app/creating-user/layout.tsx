'use client';

export default function CreatingUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style jsx global>{`
        /* Hide Next.js error overlay during user creation */
        #__next-build-watcher,
        nextjs-portal,
        [data-nextjs-dialog-overlay],
        [data-nextjs-dialog],
        [data-nextjs-toast] {
          display: none !important;
        }
      `}</style>
      {children}
    </>
  );
}
