import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import './index.css';
import { NavHeader,MeabhsMaze } from './components';
import NavBar from './components/ui/header/NavBar';

function App() {
  return (
    <BrowserRouter>
      <div className="">
        <Routes>
          <Route path="/" element={<><NavHeader /><NavBar /><MeabhsMaze/></>} exact />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;