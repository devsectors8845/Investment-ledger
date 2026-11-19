import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const MENU_WIDTH = 192;

/**
 * "Actions ⌄" dropdown used in table rows. The menu is position:fixed so it is
 * not clipped by the table's horizontal-scroll container.
 * items: [{ label, icon?, onClick, tone?: 'danger', hidden? }]
 */
export default function ActionsMenu({ items, label = 'Actions' }) {
  const [pos, setPos] = useState(null); // null = closed
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!pos) return undefined;
    const close = () => setPos(null);
    const onDown = (e) =>
      !menuRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target) && close();
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [pos]);

  const toggle = () => {
    if (pos) return setPos(null);
    const r = buttonRef.current.getBoundingClientRect();
    const visibleCount = items.filter((i) => !i.hidden).length;
    const menuHeight = visibleCount * 40 + 8;
    const openUp = r.bottom + menuHeight + 8 > window.innerHeight;
    setPos({
      top: openUp ? r.top - menuHeight - 4 : r.bottom + 4,
      left: Math.max(8, Math.min(r.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
    });
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={!!pos}
        className="inline-flex h-8 items-center gap-1 rounded-lg bg-surface-2 px-3 text-xs font-semibold text-text hover:bg-border"
      >
        {label}
        <ChevronDown className="size-3.5" />
      </button>
      {pos && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
          className="fixed z-40 rounded-xl border border-border bg-surface p-1 shadow-2xl"
        >
          {items
            .filter((i) => !i.hidden)
            .map(({ label: itemLabel, icon: Icon, onClick, tone }) => (
              <button
                key={itemLabel}
                role="menuitem"
                onClick={() => {
                  setPos(null);
                  onClick();
                }}
                className={`flex h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-surface-2 ${tone === 'danger' ? 'text-danger' : 'text-text'}`}
              >
                {Icon && <Icon className="size-4" />}
                {itemLabel}
              </button>
            ))}
        </div>
      )}
    </>
  );
}
