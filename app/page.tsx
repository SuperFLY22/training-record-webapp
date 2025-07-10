'use client';

import { useState, useEffect, useRef } from 'react';
import SignaturePad from 'signature_pad';

export default function Home() {
  const [mode, setMode] = useState<null | string>(null);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminCode, setAdminCode] = useState('');

  const [instructorInfo, setInstructorInfo] = useState({ company: '', id: '', name: '' });
  const [traineeInfo, setTraineeInfo] = useState({ dept: '', id: '', name: '' });

  const ADMIN_PASSWORD = '1234';

  const instructorPad = useRef<SignaturePad | null>(null);
  const traineePad = useRef<SignaturePad | null>(null);
  const instructorSigRef = useRef<HTMLCanvasElement | null>(null);
  const traineeSigRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (mode === 'instructor' && instructorSigRef.current) {
      instructorPad.current = new SignaturePad(instructorSigRef.current);
    } else if (mode === 'trainee' && traineeSigRef.current) {
      traineePad.current = new SignaturePad(traineeSigRef.current);
    }
  }, [mode]);

  const saveSignature = (who: 'instructor' | 'trainee') => {
    if (who === 'instructor') {
      const { company, id, name } = instructorInfo;
      if (!company || !id || !name) {
        alert('회사명, 사번, 이름을 모두 입력해주세요.');
        return;
      }
    } else {
      const { dept, id, name } = traineeInfo;
      if (!dept || !id || !name) {
        alert('소속, 사번, 이름을 모두 입력해주세요.');
        return;
      }
    }

    const pad = who === 'instructor' ? instructorPad.current : traineePad.current;
    if (pad && !pad.isEmpty()) {
      const dataURL = pad.toDataURL();
      console.log(`${who} 서명 이미지:`, dataURL);
      alert(`${who === 'instructor' ? '강사' : '수강자'} 서명이 저장되었습니다.`);
    } else {
      alert('서명이 비어 있습니다.');
    }
  };

  const clearSignature = (who: 'instructor' | 'trainee') => {
    const pad = who === 'instructor' ? instructorPad.current : traineePad.current;
    if (pad) {
      pad.clear();
    }
  };

  const handleAdminClick = () => {
    setShowAdminAuth(true);
  };

  const handleAuthSubmit = () => {
    if (adminCode === ADMIN_PASSWORD) {
      setMode('admin');
      setShowAdminAuth(false);
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const renderForm = () => {
    switch (mode) {
      case 'admin':
        return (
          <div className="border rounded-lg p-4 mt-4 shadow">
            <h2 className="text-xl font-bold mb-2">관리자 모드</h2>
            <input className="border p-2 w-full mb-2" placeholder="과목명" />
            <input className="border p-2 w-full mb-2" placeholder="교육 시간" />
            <button className="bg-blue-500 text-white w-full py-2 rounded">과정 생성</button>
          </div>
        );
      case 'instructor':
        return (
          <div className="border rounded-lg p-4 mt-4 shadow">
            <h2 className="text-xl font-bold mb-2">강사 모드</h2>
            <input className="border p-2 w-full mb-2" placeholder="회사명" value={instructorInfo.company} onChange={e => setInstructorInfo({ ...instructorInfo, company: e.target.value })} />
            <input className="border p-2 w-full mb-2" placeholder="사번" value={instructorInfo.id} onChange={e => setInstructorInfo({ ...instructorInfo, id: e.target.value })} />
            <input className="border p-2 w-full mb-2" placeholder="이름" value={instructorInfo.name} onChange={e => setInstructorInfo({ ...instructorInfo, name: e.target.value })} />
            <canvas ref={instructorSigRef} className="border w-full h-32 mb-2"></canvas>
            <div className="flex space-x-2">
              <button onClick={() => saveSignature('instructor')} className="bg-green-500 text-white w-full py-2 rounded">서명 저장</button>
              <button onClick={() => clearSignature('instructor')} className="bg-red-500 text-white w-full py-2 rounded">서명 초기화</button>
            </div>
          </div>
        );
      case 'trainee':
        return (
          <div className="border rounded-lg p-4 mt-4 shadow">
            <h2 className="text-xl font-bold mb-2">수강자 모드</h2>
            <input className="border p-2 w-full mb-2" placeholder="소속" value={traineeInfo.dept} onChange={e => setTraineeInfo({ ...traineeInfo, dept: e.target.value })} />
            <input className="border p-2 w-full mb-2" placeholder="사번" value={traineeInfo.id} onChange={e => setTraineeInfo({ ...traineeInfo, id: e.target.value })} />
            <input className="border p-2 w-full mb-2" placeholder="이름" value={traineeInfo.name} onChange={e => setTraineeInfo({ ...traineeInfo, name: e.target.value })} />
            <canvas ref={traineeSigRef} className="border w-full h-32 mb-2"></canvas>
            <div className="flex space-x-2">
              <button onClick={() => saveSignature('trainee')} className="bg-green-500 text-white w-full py-2 rounded">서명 저장</button>
              <button onClick={() => clearSignature('trainee')} className="bg-red-500 text-white w-full py-2 rounded">서명 초기화</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto relative">
      <h1 className="text-2xl font-bold mb-4">교육 기록 시스템</h1>
      <div className="flex space-x-2 mb-4">
        <button onClick={handleAdminClick} className="bg-gray-700 text-white px-4 py-2 rounded">관리자</button>
        <button onClick={() => setMode('instructor')} className="bg-gray-700 text-white px-4 py-2 rounded">강사</button>
        <button onClick={() => setMode('trainee')} className="bg-gray-700 text-white px-4 py-2 rounded">수강자</button>
      </div>

      {showAdminAuth && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-lg font-bold text-black mb-4">관리자 인증</h2>
            <input
              type="password"
              className="border p-2 w-full mb-4"
              placeholder="비밀번호 (4자리)"
              maxLength={4}
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAdminAuth(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >취소</button>
              <button
                onClick={handleAuthSubmit}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >확인</button>
            </div>
          </div>
        </div>
      )}

      {renderForm()}
    </div>
  );
}
