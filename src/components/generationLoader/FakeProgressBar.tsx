export default function FakeProgressBar() {
  return (
    <div className="w-3/4 h-4 border rounded-full ">
      <div
        className="bg-secondary-foreground rounded-full h-4 transition-all duration-300"
        style={{
          animation: 'fake-progress 25s ease-out forwards',
        }}
      />
    </div>
  );
}
