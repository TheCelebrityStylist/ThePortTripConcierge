import { useRef } from "react";

export function usePointerDrag(onDrag: (deltaX: number, event: PointerEvent) => void, onEnd: () => void) {
  const startXRef = useRef(0);

  const onPointerDown = (event: React.PointerEvent) => {
    startXRef.current = event.clientX;
    const handleMove = (moveEvent: PointerEvent) => {
      onDrag(moveEvent.clientX - startXRef.current, moveEvent);
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      onEnd();
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return { onPointerDown };
}
