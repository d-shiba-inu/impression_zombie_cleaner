import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TopPage } from './pages/TopPage/index'; // 波括弧を付ける！

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TopPage />} />
      </Routes>
    </Router>
  );
}

export default App;