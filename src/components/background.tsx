export function Background() {
  return (
    <div
      className="fixed inset-0 z-[-1] bg-contain"
      style={{ backgroundImage: "url('/treasure-map-background.png')" }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
    </div>
  );
}