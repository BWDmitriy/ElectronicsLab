import CircuitBoard from './components/CircuitBoard';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Electronics Lab</h1>
        <p className="text-gray-600">Create and simulate electronic circuits</p>
      </header>
      
      <main className="flex-grow">
        <CircuitBoard />
      </main>
      
      <footer className="mt-8 pt-4 border-t text-center text-gray-500 text-sm">
        <p>Electronics Lab Simulation - Built with Next.js</p>
        <p>Use the toolbar to add components. Select components to move or delete them.</p>
        <p>Press &apos;r&apos; to rotate selected components. Delete key removes selected items.</p>
      </footer>
    </div>
  );
}
