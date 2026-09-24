import './App.css'; // <-- Ye line sabse zaroori hai!

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Gallery from './components/Gallery';

function App() {
  return (
    // h-screen aur overflow-hidden se app desktop jaisi lagti hai
    <div className="h-screen w-screen bg-[#0a0a0c] text-white flex overflow-hidden relative">
      
      {/* Ambient Glowing Backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none"></div>

      {/* Left Sidebar Fixed */}
      <Sidebar />

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 relative">
        <Navbar />
        <Gallery />
      </div>

    </div>
  );
}

export default App;