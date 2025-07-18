'use client';

import React, { useState, useRef, useEffect } from 'react';
type Trainee = {
  team: string;
  id: string;
  name: string;
  signature?: string;
};

import SignaturePad from 'signature_pad';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function Home() {
  const [screen, setScreen] = useState<'main' | 'adminHome' | 'createCourse' | 'editCourse' | 'instructor' | 'traineeList'>('main');
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const ADMIN_PASSWORD = '1234';
  
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseTime, setNewCourseTime] = useState('');
  const [newCoursePassword, setNewCoursePassword] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courseList, setCourseList] = useState<string[]>([]);
  const [coursePasswords, setCoursePasswords] = useState<{ [course: string]: string }>({});
  const [courseCreatedDates, setCourseCreatedDates] = useState<{ [course: string]: string }>({});
  const [courseTimePerCourse, setCourseTimePerCourse] = useState<{ [key: string]: string }>({});

  // 과목 관련 상태
  const [subjectList, setSubjectList] = useState<string[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedSubjectToEdit, setSelectedSubjectToEdit] = useState('');
  const [subjectContent, setSubjectContent] = useState('');
  const [subjectContents, setSubjectContents] = useState<{ [key: string]: string }>({});

  const [courseSubjects, setCourseSubjects] = useState<{ [course: string]: string }>({});


  const [instructorCompany, setInstructorCompany] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [submissionTimestamp, setSubmissionTimestamp] = useState('');

  const [instructorSignature, setInstructorSignature] = useState<string | null>(null);
  const [instructorLocation, setInstructorLocation] = useState('');

  const [lectureDate, setLectureDate] = useState('');

  const [traineeTeam, setTraineeTeam] = useState('');
  const [traineeId, setTraineeId] = useState('');
  const [traineeName, setTraineeName] = useState('');
 const [trainees, setTrainees] = useState<Trainee[]>([]);

  const [traineeListPerCourse, setTraineeListPerCourse] = useState<{ [key: string]: Trainee[] }>({});

  const [showInstructorAuth, setShowInstructorAuth] = useState(false);
  const [instructorCode, setInstructorCode] = useState('');

  const [submittedDate, setSubmittedDate] = useState('');

  const instructorSigRef = useRef<HTMLCanvasElement | null>(null);
  const instructorPad = useRef<SignaturePad | null>(null);
  const traineeSigRef = useRef<HTMLCanvasElement | null>(null);
  const traineePad = useRef<SignaturePad | null>(null);

const resizeCanvas = (canvas: HTMLCanvasElement, width = 400, height = 400) => {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const context = canvas.getContext('2d');
  if (context) {
    context.scale(ratio, ratio);
  }
};

  // 화면 전환 시 SignaturePad 초기화
  useEffect(() => {
    if (screen === 'instructor') {
      if (instructorSigRef.current) {
        instructorPad.current = new SignaturePad(instructorSigRef.current);
        resizeCanvas(instructorSigRef.current);
        instructorPad.current.clear();
      }
      if (traineeSigRef.current) {
        traineePad.current = new SignaturePad(traineeSigRef.current);
        resizeCanvas(traineeSigRef.current);
        traineePad.current.clear();
      }

      if (selectedCourse && traineeListPerCourse[selectedCourse]) {
        setTrainees(traineeListPerCourse[selectedCourse]);
      } else {
        setTrainees([]);
      }

      setInstructorCompany('');
      setInstructorId('');
      setInstructorName('');
      setSubmissionTimestamp('');
    }
  }, [screen, selectedCourse]);

  // 관리자 비밀번호 확인
  const handleAdminConfirm = () => {
    if (adminCode === ADMIN_PASSWORD) {
      setShowAdminAuth(false);
      setAdminCode('');
      setScreen('adminHome');
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  // 과목 추가
  const handleAddSubject = () => {
    if (!newSubjectName) return alert('추가할 과목명을 입력하세요.');
    if (!subjectContent) return alert('과목 내용을 입력하세요.');

    setSubjectList(prev => [...prev, newSubjectName]);
    setSubjectContents(prev => ({ ...prev, [newSubjectName]: subjectContent }));
    setNewSubjectName('');
    setSubjectContent('');
    alert('과목이 추가되었습니다.');
  };

  // 과목 선택 시 내용 로드
  const handleSelectSubjectToEdit = (subject: string) => {
    setSelectedSubjectToEdit(subject);
    setSubjectContent(subjectContents[subject] || '');
  };

  // 과목 내용 수정
  const handleEditSubject = () => {
    if (!selectedSubjectToEdit) return alert('수정할 과목을 선택하세요.');
    setSubjectContents(prev => ({ ...prev, [selectedSubjectToEdit]: subjectContent }));
    alert('과목 내용이 수정되었습니다.');
  };

  // 과목 삭제
  const handleDeleteSubject = () => {
    if (!selectedSubjectToEdit) return alert('삭제할 과목을 선택하세요.');

    setSubjectList(prev => prev.filter(s => s !== selectedSubjectToEdit));
    setSubjectContents(prev => {
      const copy = { ...prev };
      delete copy[selectedSubjectToEdit];
      return copy;
    });
    setSelectedSubjectToEdit('');
    setSubjectContent('');
    alert('과목이 삭제되었습니다.');
  };

  // 과정 생성
  const handleCreateCourse = () => {
    if (!newCourseName || !newCourseTime || !newCoursePassword) {
      return alert('과정명, 교육시간, 비밀번호를 모두 입력하세요.');
    }
    if (!selectedSubject) return alert('과목명을 먼저 선택하세요.');

    // 과정 생성 시
    setCourseList(prev => [...prev, newCourseName]);
    setCoursePasswords(prev => ({ ...prev, [newCourseName]: newCoursePassword }));
    setCourseCreatedDates(prev => ({ ...prev, [newCourseName]: new Date().toLocaleDateString() }));
    setCourseTimePerCourse(prev => ({ ...prev, [newCourseName]: newCourseTime }));

    // 🔽 여기에 과목 매핑 추가!
    setCourseSubjects(prev => ({ ...prev, [newCourseName]: selectedSubject }));
    
    setNewCourseName('');
    setNewCourseTime('');
    setNewCoursePassword('');
    setSelectedSubject('');
    alert('과정이 생성되었습니다.');
  };

  // 수강생 추가
      const handleAddTrainee = () => {
        if (!traineeTeam || !traineeId || !traineeName) {
          return alert('수강자 소속, 사번, 이름을 모두 입력하세요.');
        }

        if (!traineePad.current || traineePad.current.isEmpty()) {
          return alert('수강생 서명을 입력해주세요.');
        }

        const sigData = traineePad.current.toDataURL();

        const newList = [...trainees, {
          team: traineeTeam,
          id: traineeId,
          name: traineeName,
          signature: sigData
        }];

        setTrainees(newList);
        if (selectedCourse) {
          setTraineeListPerCourse(prev => ({ ...prev, [selectedCourse]: newList }));
        }

        setTraineeTeam('');
        setTraineeId('');
        setTraineeName('');
        traineePad.current.clear();

// ✅ 수강생 서명 초기화
if (traineePad.current) {
  traineePad.current.clear();
}
    if (selectedCourse) {
      setTraineeListPerCourse(prev => ({ ...prev, [selectedCourse]: newList }));
    }
    setTraineeTeam('');
    setTraineeId('');
    setTraineeName('');
  };

  const handleDeleteTrainee = (idx: number) => {
    const newList = trainees.filter((_, i) => i !== idx);
    setTrainees(newList);
    if (selectedCourse) {
      setTraineeListPerCourse(prev => ({ ...prev, [selectedCourse]: newList }));
    }
  };

    const handleClearTrainees = () => {
    setTrainees([]);
    if (selectedCourse) {
      setTraineeListPerCourse(prev => ({ ...prev, [selectedCourse]: [] }));
    }
  };

    // 서명 후 제출
    const handleSubmit = () => {
      if (!instructorCompany || !instructorId || !instructorName) {
        return alert('회사명, 사번, 이름을 입력하세요.');
      }
      if (trainees.length === 0) {
        return alert('수강자가 최소 1명 이상 필요합니다.');
      }
      if (!instructorPad.current || instructorPad.current.isEmpty()) {
        return alert('서명 패드를 채워주세요.');
      }
      if (!lectureDate) {
        alert("강의 날짜가 입력되지 않았습니다.");
        return;
      }

      // ✅ 서명 저장
      const sigData = instructorPad.current.toDataURL();
      setInstructorSignature(sigData); // 상태 저장

      setSubmissionTimestamp(new Date().toLocaleString());
      instructorPad.current.clear(); // 강사 서명 초기화
      alert('제출되었습니다. 이제 엑셀 다운로드가 가능합니다.');
    };

  // 엑셀 파일로 내보내기
  const exportToExcel = async () => {
  if (!selectedSubject || !subjectContents[selectedSubject]) {
    alert('과목 정보가 누락되었습니다.');
    return;
  }
  if (!lectureDate) {
    alert('강의 날짜를 입력하세요.');
    return;
  }

  // 브라우저 환경에서는 fetch로 public 경로의 템플릿 파일 로드
  const workbook = new ExcelJS.Workbook();
  const response = await fetch('/template.xlsx');
  const arrayBuffer = await response.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];
  const courseTime = courseTimePerCourse[selectedCourse] || newCourseTime || '';
  const submitted = submittedDate || new Date().toLocaleDateString();

 // ✅ 관리자/강사용 입력
  worksheet.getCell('B3').value = selectedSubject;
  worksheet.getCell('B4').value = subjectContents[selectedSubject];
  worksheet.getCell('F5').value = courseTime;
  worksheet.getCell('B5').value = lectureDate;
  worksheet.getCell('C27').value = submitted;
  
  worksheet.getCell('I5').value = instructorLocation;
  worksheet.getCell('B7').value = instructorCompany || '';
  worksheet.getCell('F7').value = instructorId || '';
  worksheet.getCell('I7').value = instructorName || '';



    // 🔄 강사 서명 추가
    if (instructorSignature) {
      const image = workbook.addImage({ base64: instructorSignature, extension: 'png' });
      worksheet.addImage(image, 'I27:I27');
    }

  // ✅ 수강생 입력 (서명 포함)
  trainees.forEach((trainee, index) => {
    const row = 10 + index;
    worksheet.getCell(`A${row}`).value = trainee.team;
    worksheet.getCell(`C${row}`).value = trainee.id;
    worksheet.getCell(`E${row}`).value = trainee.name;

    if (trainee.signature) {
      const image = workbook.addImage({ base64: trainee.signature, extension: 'png' });
      worksheet.addImage(image, `H${row}:H${row}`);
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'training_output.xlsx');
};

  // TODO: 엑셀 생성 함수
  const generateCourseExcel = async (course: string) => {
    if (!course) return;

    const workbook = new ExcelJS.Workbook();
    const response = await fetch('/template.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];

      // 강사/수강생 데이터는 현재 상태값을 기반으로 가져옴
    const subjectName = courseSubjects[course] || selectedSubject || course;
    const subjectContent = subjectContents[subjectName] || '';
    const courseTime = courseTimePerCourse[course] || newCourseTime || '';
    const dateStr = lectureDate || new Date().toLocaleDateString();
    const traineesInCourse = traineeListPerCourse[course] || trainees;


    // 📌 기본 정보 입력
    worksheet.getCell('B3').value = subjectName;
    worksheet.getCell('B4').value = subjectContent;
    worksheet.getCell('F5').value = courseTime;
    worksheet.getCell('B5').value = dateStr;
    worksheet.getCell('C27').value = submittedDate || new Date().toLocaleDateString(); // 제출일
    worksheet.getCell('I5').value = instructorLocation; // 위치

    worksheet.getCell('B7').value = instructorCompany;
    worksheet.getCell('F7').value = instructorId;
    worksheet.getCell('I7').value = instructorName;

// ✅ 강사 서명 이미지 삽입
if (instructorSignature) {
  const image = workbook.addImage({ base64: instructorSignature, extension: 'png' });

  // 행 높이도 설정 (엑셀에서 보기 좋게)
  worksheet.getRow(27).height = 81.9;

  worksheet.addImage(image, {
    tl: { col: 8, row: 26 }, // I27 셀
    ext: { width: 287, height: 109 },
    editAs: 'oneCell',
  });
}

// 🔄 수강생 정보 + 서명 이미지 삽입
traineesInCourse.forEach((trainee, index) => {
  const row = 10 + index;

  worksheet.getCell(`A${row}`).value = trainee.team;
  worksheet.getCell(`C${row}`).value = trainee.id;
  worksheet.getCell(`E${row}`).value = trainee.name;

  // 행 높이 설정
  worksheet.getRow(row).height = 24.9;

  if (trainee.signature) {
    const image = workbook.addImage({ base64: trainee.signature, extension: 'png' });

    worksheet.addImage(image, {
      tl: { col: 7, row: row - 1 }, // H열 (0-indexed)
      ext: { width: 184, height: 33 },
      editAs: 'oneCell',
    });
  }
});

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${course}_전체정보.xlsx`);
  };

  // TODO: 과정 삭제 기능
  const handleDeleteCourse = (course: string) => {
    if (confirm(`${course} 과정을 삭제하시겠습니까?`)) {
      setCourseList(prev => prev.filter(c => c !== course));
      setCoursePasswords(prev => {
        const cp = { ...prev };
        delete cp[course];
        return cp;
      });
      setCourseCreatedDates(prev => {
        const cd = { ...prev };
        delete cd[course];
        return cd;
      });
    }
  };

  // UI 구성 시작
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 관리자 인증 모달 */}
      {showAdminAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-lg font-bold mb-4">관리자 인증</h2>
            <input
              type="password"
              className="border p-2 w-full mb-4"
              placeholder="비밀번호 (4자리)"
              maxLength={4}
              value={adminCode}
              onChange={e => setAdminCode(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => { setShowAdminAuth(false); setAdminCode(''); }}
              >
                취소
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={handleAdminConfirm}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 강사 인증 모달 */}
      {showInstructorAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-lg font-bold mb-4">과정 비밀번호 인증</h2>
            <input
              type="password"
              className="border p-2 w-full mb-4"
              placeholder="비밀번호 입력"
              value={instructorCode}
              onChange={e => setInstructorCode(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => { setShowInstructorAuth(false); setInstructorCode(''); }}
              >
                취소
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => {
                  if (coursePasswords[selectedCourse] === instructorCode) {
                    setShowInstructorAuth(false);
                    setInstructorCode('');
                    setScreen('instructor');
                  } else {
                    alert('비밀번호가 틀렸습니다.');
                  }
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메인 화면 */}
      {screen === 'main' && (
        <div className="flex flex-col items-center space-y-6 mt-16">
          <button
            className="w-64 h-16 bg-orange-500 text-white text-xl rounded"
            onClick={() => { setShowInstructorAuth(false); setShowAdminAuth(true); }}
          >
            관리자 모드
          </button>

          <select
            className="w-64 h-12 border text-center"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
          >
            <option value="">과정 선택</option>
            {courseList.map((course, idx) => (
              <option key={idx} value={course}>
                {course}
              </option>
            ))}
          </select>

          <button
            className="w-64 h-16 bg-blue-500 text-white text-xl rounded"
            onClick={() => {
              if (!selectedCourse) {
                alert('과정을 먼저 선택하세요.');
                return;
              }
              setShowAdminAuth(false);
              setShowInstructorAuth(true);
            }}
          >
            강사 모드
          </button>
        </div>
      )}

      {/* Step 1: 관리자 홈 화면 */}
      {screen === 'adminHome' && (
  <div className="space-y-6 mt-8">
    <h2 className="text-2xl font-bold">관리자 홈</h2>
    <div className="flex space-x-4">
      <button
        className="bg-green-500 text-white px-4 py-2 rounded"
        onClick={() => setScreen('createCourse')}
      >
        과정 생성
      </button>
      <button
        className="bg-pink-500 text-white px-4 py-2 rounded"
        onClick={() => setScreen('editCourse')}
      >
        과목 수정
      </button>
    </div>

    {/* ✅ 생성된 과정 목록 (다운로드 및 삭제만 가능) */}
    <div className="mt-6 space-y-2">
      <h3 className="text-lg font-semibold">생성된 과정 목록</h3>
      {courseList.map((course, idx) => (
        <div key={idx} className="flex justify-between items-center p-2 border rounded">
          <div>
            <div className="font-semibold">{course}</div>
            <div className="text-sm text-gray-500">
              생성일: {courseCreatedDates[course] || '정보 없음'}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => generateCourseExcel(course)}
            >
              다운로드
            </button>
            <button
              className="bg-red-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => {
                if (window.confirm(`${course} 과정을 삭제하시겠습니까?`)) {
                  setCourseList(prev => prev.filter(c => c !== course));
                  setCoursePasswords(prev => {
                    const copy = { ...prev };
                    delete copy[course];
                    return copy;
                  });
                  setCourseCreatedDates(prev => {
                    const copy = { ...prev };
                    delete copy[course];
                    return copy;
                  });
                  setCourseTimePerCourse(prev => {
                    const copy = { ...prev };
                    delete copy[course];
                    return copy;
                  });
                  setCourseSubjects(prev => {
                    const copy = { ...prev };
                    delete copy[course];
                    return copy;
                  });
                  setTraineeListPerCourse(prev => {
                    const copy = { ...prev };
                    delete copy[course];
                    return copy;
                  });
                }
              }}
            >
              삭제
            </button>
          </div>
        </div>
      ))}
    </div>

    <button
      className="bg-gray-400 text-white px-4 py-2 rounded"
      onClick={() => setScreen('main')}
    >
      메인화면으로
    </button>
  </div>
)}

    {/* Step 2: 과정 생성 화면 */}
    {screen === 'createCourse' && (
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">과정 생성</h2>
        <input
          className="border p-2 w-full"
          placeholder="과정명"
          value={newCourseName}
          onChange={e => setNewCourseName(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          placeholder="교육시간"
          value={newCourseTime}
          onChange={e => setNewCourseTime(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          placeholder="과정 비밀번호"
          value={newCoursePassword}
          onChange={e => setNewCoursePassword(e.target.value)}
        />
        <select
          className="border p-2 w-full"
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
        >
          <option value="">과목 선택</option>
          {subjectList.map((subj, idx) => (
            <option key={idx} value={subj}>{subj}</option>
          ))}
        </select>
        <div className="flex space-x-2">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded flex-1"
            onClick={handleCreateCourse}
          >
            생성
          </button>
          <button
            className="bg-gray-400 text-white px-4 py-2 rounded flex-1"
            onClick={() => setScreen('adminHome')}
          >
            뒤로가기
          </button>
        </div>
      </div>
    )}

    {/* Step 3: 과목 수정 화면 */}
      {screen === 'editCourse' && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold">과목 관리</h2>
          <input
            className="border p-2 w-full"
            placeholder="새 과목명"
            value={newSubjectName}
            onChange={e => setNewSubjectName(e.target.value)}
          />
          <textarea
            className="border p-2 w-full h-24"
            placeholder="과목 내용"
            value={subjectContent}
            onChange={e => setSubjectContent(e.target.value)}
          />
          <div className="flex space-x-2">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded flex-1"
              onClick={handleAddSubject}
            >
              추가
            </button>
            <button
              className="bg-yellow-500 text-white px-4 py-2 rounded flex-1"
              onClick={handleEditSubject}
            >
              수정
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded flex-1"
              onClick={handleDeleteSubject}
            >
              삭제
            </button>
          </div>
          <select
            className="border p-2 w-full"
            value={selectedSubjectToEdit}
            onChange={e => handleSelectSubjectToEdit(e.target.value)}
          >
            <option value="">과목 선택</option>
            {subjectList.map((subj, idx) => (
              <option key={idx} value={subj}>{subj}</option>
            ))}
          </select>
          <button
            className="bg-gray-400 text-white px-4 py-2 rounded w-full"
            onClick={() => setScreen('adminHome')}
          >
            뒤로가기
          </button>
        </div>
      )}

    {/* Step 4: 강사 화면 */}
      {screen === 'instructor' && (
        <div className="mt-8 space-y-6">
          <h2 className="text-2xl font-bold text-center">강사 입력 화면</h2>

          <div className="bg-gray-100 p-4 rounded space-y-4">
            <h3 className="text-lg font-semibold">강사 정보</h3>
            <input className="border p-2 w-full" placeholder="회사명" value={instructorCompany} onChange={e => setInstructorCompany(e.target.value)} />
            <input className="border p-2 w-full" placeholder="사번" value={instructorId} onChange={e => setInstructorId(e.target.value)} />
            <input className="border p-2 w-full" placeholder="이름" value={instructorName} onChange={e => setInstructorName(e.target.value)} />
            <input className="border p-2 w-full" placeholder="Location" value={instructorLocation} onChange={e => setInstructorLocation(e.target.value)} />
            <label className="block">서명</label>
            <canvas ref={instructorSigRef} className="border w-40 h-40" style={{ width: "400px", height: "400px" }} />
            <button className="bg-gray-400 text-white w-full py-2 rounded" onClick={() => instructorPad.current?.clear()}>서명 초기화</button>
          </div>

          <div className="bg-gray-100 p-4 rounded space-y-4">
            <h3 className="text-lg font-semibold">수강생 정보</h3>
            <input className="border p-2 w-full" placeholder="소속" value={traineeTeam} onChange={e => setTraineeTeam(e.target.value)} />
            <input className="border p-2 w-full" placeholder="사번" value={traineeId} onChange={e => setTraineeId(e.target.value)} />
            <input className="border p-2 w-full" placeholder="이름" value={traineeName} onChange={e => setTraineeName(e.target.value)} />
            <label className="block">서명</label>
            <canvas ref={traineeSigRef} className="border w-40 h-40" style={{ width: "400px", height: "400px" }} />
            <button className="bg-gray-400 text-white w-full py-2 rounded" onClick={() => traineePad.current?.clear()}>서명 초기화</button>
            <button className="bg-green-500 text-white w-full py-2 rounded" onClick={handleAddTrainee}>수강생 추가</button>
          </div>

          <div className="bg-white p-4 rounded border text-center">
            <h3 className="text-lg font-semibold mb-2">수강생 상태</h3>
            <p className="text-xl">{trainees.length}명 완료됨</p>
            <button
              className="bg-blue-500 text-white w-full py-2 rounded mt-2"
              onClick={() => setScreen('traineeList')}
            >
              전체 수강생 보기
            </button>
          </div>

          <div className="flex space-x-2 items-end">
            <div className="flex-1">
              <label className="block font-medium mb-1">강의 날짜 (YYYY-MM-DD)</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                className="border p-2 w-full"
                value={lectureDate}
                onChange={e => setLectureDate(e.target.value)}
              />
              <input
                className="border p-2 w-full"
                placeholder="제출일 (예: YYYY-MM-DD)"
                value={submittedDate}
                onChange={e => setSubmittedDate(e.target.value)}
              />
            </div>

            <button
              className="bg-yellow-400 text-black w-1/2 py-2 rounded"
              onClick={handleSubmit}
            >
              제출
            </button>
          </div>

          <button
            className="bg-gray-400 text-white w-full py-2 rounded mt-2"
            onClick={() => setScreen('main')}
          >
            메인화면
          </button>         
        </div>
      )}

      {/* Step 5: 수강생 목록 화면 */}
        {screen === 'traineeList' && (
        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold text-center">전체 수강생 목록</h2>

      <ul className="space-y-2 border p-4 rounded bg-white">
        {trainees.length === 0 ? (
          <p>등록된 수강생이 없습니다.</p>
        ) : (
          trainees.map((t, idx) => (
            <li key={idx} className="flex justify-between items-center border-b pb-1">
              <span>{t.team} / {t.id} / {t.name}</span>
              <button
                onClick={() => handleDeleteTrainee(idx)}
                className="text-sm text-red-500"
              >
                삭제
              </button>
            </li>
          ))
        )}
      </ul>

    {/* ✅ 전체 삭제 버튼 추가 */}
    {trainees.length > 0 && (
      <button
        className="bg-red-500 text-white w-full py-2 rounded"
        onClick={handleClearTrainees}
      >
        전체 수강생 삭제
      </button>
    )}

    <button
      className="bg-gray-400 text-white w-full py-2 rounded"
      onClick={() => setScreen('instructor')}
    >
      돌아가기
    </button>
  </div>
)}
    </div>
  );
} 
