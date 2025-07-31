'use client';

import React, { useState, useEffect, useRef } from 'react';
import SignaturePad from 'signature_pad';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

type Trainee = {
  team: string;
  id: string;
  name: string;
  signature?: string;
};

// ---------- Firestore 관련 함수 ----------
const saveSubjectsToFirebase = async (
  mode: "domestic" | "overseas",
  list: string[],
  contents: Record<string, string>
) => {
  try {
    await setDoc(
      doc(db, `config_${mode}`, `${mode}_subject`),   // 🔹 문서명을 동적으로
      {
        subjectList: list,
        subjectContents: contents,
      }
    );
  } catch (error) {
    console.error("Error saving subjects:", error);
  }
};

  const loadSubjectsFromFirebase = async (
  mode: "domestic" | "overseas",
  setSubjectList: Function,
  setSubjectContents: Function
) => {
  try {
    const docSnap = await getDoc(
      doc(db, `config_${mode}`, `${mode}_subject`)   // 🔹 문서명을 동적으로
    );

    if (docSnap.exists()) {
      const data = docSnap.data();
      setSubjectList(data.subjectList || []);
      setSubjectContents(data.subjectContents || {});
    } else {
      console.warn(`${mode} subject document not found`);
      setSubjectList([]);
      setSubjectContents({});
    }
  } catch (error) {
    console.error("Error loading subjects:", error);
  }
};

const saveCourseToFirebase = async (
  mode: "domestic" | "overseas",
  name: string,
  password: string,
  time: string,
  subjectName: string
) => {
  try {
    await setDoc(
      doc(db, mode === "domestic" ? "course_domestic" : "course_overseas", name),
      {
        subject: subjectName,
        time: time,
        password: password,
        createdDate: new Date().toLocaleDateString(),
        trainees: []   // 초기 trainee 리스트
      }
    );
  } catch (error) {
    console.error("Error saving course:", error);
  }
};

    const loadCoursesFromFirebase = async (
  mode: "domestic" | "overseas",
  setCourseList: Function,
  setCoursePasswords: Function,
  setCourseTimePerCourse: Function,
  setCourseCreatedDates: Function,
  setTraineeListPerCourse: Function,
  setCourseSubjects: Function
) => {
  try {
    const collectionName = mode === "domestic" ? "course_domestic" : "course_overseas";
    const snapshot = await getDocs(collection(db, collectionName));

    const courseNames: string[] = [];
    const passwords: { [key: string]: string } = {};
    const times: { [key: string]: string } = {};
    const createdDates: { [key: string]: string } = {};
    const traineeMap: { [key: string]: Trainee[] } = {};
    const subjects: { [key: string]: string } = {};

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const courseName = docSnap.id;
      courseNames.push(courseName);
      passwords[courseName] = data.password || "";
      times[courseName] = data.time || "";
      createdDates[courseName] = data.createdDate || "";
      traineeMap[courseName] = data.trainees || [];
      subjects[courseName] = data.subject || "";
    });

    setCourseList(courseNames);
    setCoursePasswords(passwords);
    setCourseTimePerCourse(times);
    setCourseCreatedDates(createdDates);
    setTraineeListPerCourse(traineeMap);
    setCourseSubjects(subjects);
  } catch (error) {
    console.error("Error loading courses:", error);
  }
};

  const saveTraineesToFirebase = async (
  mode: "domestic" | "overseas",
  courseName: string,
  trainees: Trainee[]
) => {
  const courseRef = doc(
    db,
    mode === "domestic" ? "course_domestic" : "course_overseas",
    courseName
  );
  await updateDoc(courseRef, { trainees });
};

// ---------- 메인 컴포넌트 ----------
export default function Home() {
  const [selectedMode, setSelectedMode] = useState<"domestic" | "overseas" | null>(null);

  const [screen, setScreen] = useState<'main' | 'adminHome' | 'createCourse' | 'editCourse' | 'instructor' | 'traineeList'>('main');
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const ADMIN_PASSWORD = '1234';

  const [showInstructorAuth, setShowInstructorAuth] = useState(false);
  const [instructorCode, setInstructorCode] = useState('');
 
  const [courseList, setCourseList] = useState<string[]>([]);
  const [coursePasswords, setCoursePasswords] = useState<{ [course: string]: string }>({});
  const [courseCreatedDates, setCourseCreatedDates] = useState<{ [course: string]: string }>({});
  const [courseTimePerCourse, setCourseTimePerCourse] = useState<{ [course: string]: string }>({});
  const [courseSubjects, setCourseSubjects] = useState<{ [course: string]: string }>({});
  const [traineeListPerCourse, setTraineeListPerCourse] = useState<{ [course: string]: Trainee[] }>({});

  const [subjectList, setSubjectList] = useState<string[]>([]);
  const [subjectContents, setSubjectContents] = useState<{ [key: string]: string }>({});
  const [newSubjectName, setNewSubjectName] = useState('');
  const [subjectContent, setSubjectContent] = useState('');
  const [selectedSubjectToEdit, setSelectedSubjectToEdit] = useState('');

  const [selectedCourse, setSelectedCourse] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseTime, setNewCourseTime] = useState('');
  const [newCoursePassword, setNewCoursePassword] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [instructorCompany, setInstructorCompany] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [instructorLocation, setInstructorLocation] = useState('');
  const instructorSigRef = useRef<HTMLCanvasElement | null>(null);
  const instructorPad = useRef<SignaturePad | null>(null);

  const [traineeTeam, setTraineeTeam] = useState('');
  const [traineeId, setTraineeId] = useState('');
  const [traineeName, setTraineeName] = useState('');
  const traineeSigRef = useRef<HTMLCanvasElement | null>(null);
  const traineePad = useRef<SignaturePad | null>(null);
  const [trainees, setTrainees] = useState<Trainee[]>([]);

  const [lectureDate, setLectureDate] = useState('');
  const [submittedDate, setSubmittedDate] = useState('');
  const [submissionTimestamp, setSubmissionTimestamp] = useState('');
  const [instructorSignature, setInstructorSignature] = useState<string>('');

  const [submittedCourses, setSubmittedCourses] = useState<{ [courseName: string]: boolean }>({});

   const [isSubmitted, setIsSubmitted] = useState(false);

  // ✅ 초기 subject 불러오기
  useEffect(() => {
  if (selectedMode) {
    loadSubjectsFromFirebase(selectedMode, setSubjectList, setSubjectContents);
    loadCoursesFromFirebase(
      selectedMode,
      setCourseList,
      setCoursePasswords,
      setCourseTimePerCourse,
      setCourseCreatedDates,
      setTraineeListPerCourse,
      setCourseSubjects
    );
  }
}, [selectedMode]);
  
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

    // 🔹 기존 초기화 항목
    setInstructorCompany('');
    setInstructorId('');
    setInstructorName('');
    setSubmissionTimestamp('');

    // 🔹 추가 초기화 항목
    setInstructorLocation('');
    setLectureDate('');
    setSubmittedDate('');
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
  const handleAddSubject = async () => {
    if (!newSubjectName) return alert('Please enter a subject name.');
    if (!subjectContent) return alert('Please enter subject content.');

    const updatedList = [...subjectList, newSubjectName];
    const updatedContents = { ...subjectContents, [newSubjectName]: subjectContent };

    setSubjectList(updatedList);
    setSubjectContents(updatedContents);
    setNewSubjectName('');
    setSubjectContent('');
    alert('Subject added successfully.');

    // ✅ Firebase에 저장
    await saveSubjectsToFirebase(selectedMode!, updatedList, updatedContents);
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
  const handleDeleteSubject = async () => {
  if (!selectedSubjectToEdit) return alert("삭제할 과목을 선택하세요.");
  if (!selectedMode) return alert("모드를 먼저 선택하세요.");

  const confirmDelete = confirm(`${selectedSubjectToEdit} 과목을 삭제하시겠습니까?`);
  if (!confirmDelete) return;

  try {
    // **UI 상태 업데이트**
    const updatedList = subjectList.filter((s) => s !== selectedSubjectToEdit);
    const updatedContents = { ...subjectContents };
    delete updatedContents[selectedSubjectToEdit];

    // **Firestore 전체 문서 업데이트**
    await saveSubjectsToFirebase(selectedMode, updatedList, updatedContents);

    setSubjectList(updatedList);
    setSubjectContents(updatedContents);
    setSelectedSubjectToEdit("");
    setSubjectContent("");

    alert(`${selectedSubjectToEdit} 과목이 삭제되었습니다.`);
  } catch (error) {
    console.error("Error deleting subject:", error);
    alert("과목 삭제 중 오류가 발생했습니다.");
  }
};

  // 과정 생성
  const handleCreateCourse = async () => {
  if (!newCourseName || !newCourseTime || !newCoursePassword) {
    return alert("Please enter the course name, duration, and password.");
  }
  if (!selectedSubject) return alert("Please select a subject.");

  setCourseList(prev => [...prev, newCourseName]);
  setCoursePasswords(prev => ({ ...prev, [newCourseName]: newCoursePassword }));
  setCourseCreatedDates(prev => ({ ...prev, [newCourseName]: new Date().toLocaleDateString() }));
  setCourseTimePerCourse(prev => ({ ...prev, [newCourseName]: newCourseTime }));
  setCourseSubjects(prev => ({ ...prev, [newCourseName]: selectedSubject }));

  // **Firestore 저장 추가**
  await saveCourseToFirebase(selectedMode!, newCourseName, newCoursePassword, newCourseTime, selectedSubject);

  setNewCourseName('');
  setNewCourseTime('');
  setNewCoursePassword('');
  setSelectedSubject('');
  alert('과정이 생성되었습니다.');
};

  // ---------- 수강생 추가 ----------
    const handleAddTrainee = async () => {
  // 🔹 추가된 부분 시작
  if (trainees.length >= 15) {
    return alert('You can register up to 15 participants only.');
  }
  // 🔹 추가된 부분 끝

  if (!traineeTeam || !traineeId || !traineeName) {
    return alert("Please enter the trainee's team, ID, and name.");
  }
  if (!traineePad.current || traineePad.current.isEmpty()) {
    return alert("Please provide the trainee's signature.");
  }

  const sigData = traineePad.current.toDataURL();
  const newList = [...trainees, { team: traineeTeam, id: traineeId, name: traineeName, signature: sigData }];

  setTrainees(newList);

  if (selectedCourse) {
    setTraineeListPerCourse(prev => ({ ...prev, [selectedCourse]: newList }));
    await saveTraineesToFirebase(selectedMode!, selectedCourse, newList);
  }

  setTraineeTeam('');
  setTraineeId('');
  setTraineeName('');
  traineePad.current.clear();
};

  // ---------- 수강생 관리 ----------
  // 수강생 목록 보기
    const handleDeleteTrainee = async (idx: number) => {
    const newList = trainees.filter((_, i) => i !== idx);
    setTrainees(newList);
    if (selectedCourse) {
      setTraineeListPerCourse(prev => ({ ...prev, [selectedCourse]: newList }));
      await saveTraineesToFirebase(selectedMode!, selectedCourse, newList);
    }
  };

  const handleClearTrainees = async () => {
    setTrainees([]);
    if (selectedCourse) {
      setTraineeListPerCourse(prev => ({ ...prev, [selectedCourse]: [] }));
      await saveTraineesToFirebase(selectedMode!, selectedCourse, []);
    }
  };


    // 서명 후 제출
    const handleSubmit = () => {
      if (!instructorCompany || !instructorId || !instructorName) {
        return alert('Please enter the company name, employee ID, and name.');
      }
      if (trainees.length === 0) {
        return alert('At least one trainee is required.');
      }
      if (!instructorPad.current || instructorPad.current.isEmpty()) {
        return alert('Please provide the instructor\'s signature.');
      }
      if (!lectureDate) {
        alert("Please enter the lecture date.");
        return;
      }

      // ✅ 서명 저장
      const sigData = instructorPad.current.toDataURL();
      setInstructorSignature(sigData);
      setSubmissionTimestamp(new Date().toLocaleString());
      instructorPad.current.clear();

      setIsSubmitted(true);   // ✅ 제출 후 다운로드 가능하도록 상태 변경
      setSubmittedCourses(prev => ({ ...prev, [selectedCourse]: true })); // ✅ 추가
      alert('SESSION SUBMITTED!');
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

  worksheet.getCell('F8').value = selectedCourse ? selectedCourse : '';

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

    worksheet.getCell('F8').value = course;  // 업체명(과정명) 입력

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

  // 과정 삭제 기능
  const handleDeleteCourse = async (course: string) => {
  if (confirm(`${course} 과정을 삭제하시겠습니까?`)) {
    const updatedList = courseList.filter(c => c !== course);
    const updatedPasswords = { ...coursePasswords };
    const updatedDates = { ...courseCreatedDates };
    const updatedTimes = { ...courseTimePerCourse };
    const updatedSubjects = { ...courseSubjects };
    
    delete updatedPasswords[course];
    delete updatedDates[course];
    delete updatedTimes[course];
    delete updatedSubjects[course];

    setCourseList(updatedList);
    setCoursePasswords(updatedPasswords);
    setCourseCreatedDates(updatedDates);
    setCourseTimePerCourse(updatedTimes);
    setCourseSubjects(updatedSubjects);

    // **Firebase 반영**
    const collectionName = selectedMode === "domestic" ? "course_domestic" : "course_overseas";
    await deleteDoc(doc(db, collectionName, course));

    alert(`${course} 과정이 삭제되었습니다.`);
  }
};

  // UI 구성 시작
  // 모드 선택 화면
  if (!selectedMode) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6">
        <h1 className="text-2xl font-bold">모드를 선택하세요</h1>
        <button
          className="bg-blue-500 text-white px-6 py-3 rounded"
          onClick={() => setSelectedMode("overseas")}
        >
          해외위탁 모드
        </button>
        <button
          className="bg-green-500 text-white px-6 py-3 rounded"
          onClick={() => setSelectedMode("domestic")}
        >
          국내 모드
        </button>
      </div>
    );
  }

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
            <h2 className="text-lg font-bold mb-4">Course Password</h2>
            <input
              type="password"
              className="border p-2 w-full mb-4"
              placeholder="Enter password"
              value={instructorCode}
              onChange={e => setInstructorCode(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
            <button
              className="bg-gray-300 px-4 py-2 rounded"
              onClick={() => { setShowInstructorAuth(false); setInstructorCode(''); }}
            >
              Cancel
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => {
                if (coursePasswords[selectedCourse] === instructorCode) {
                  setShowInstructorAuth(false);
                  setInstructorCode('');
                  setScreen('instructor');
                } else {
                  alert('Incorrect password.');
                }
              }}
            >
              Ok
            </button>
            </div>
          </div>
        </div>
      )}

      {/* 메인 화면 */}
      {screen === 'main' && (
        <div className="flex flex-col items-center space-y-8 mt-10">
          <button
            className="w-64 h-16 bg-orange-500 text-white text-xl rounded"
            onClick={() => { setShowInstructorAuth(false); setShowAdminAuth(true); }}
          >
            Admin Mode
          </button>

          <select
            className="w-64 h-12 border text-left"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
          >
            <option value="">Select Course</option>
            {courseList.map((course) => (
            <option key={course} value={course}>
              {course} ({courseSubjects[course] || 'No Subject'})
            </option>
          ))}
          </select>

          <button
            className="w-64 h-16 bg-blue-500 text-white text-xl rounded"
            onClick={() => {
              if (!selectedCourse) {
                alert('Please select a course first.');
                return;
              }
              setShowAdminAuth(false);
              setShowInstructorAuth(true);
            }}
          >
            Instructor Mode
          </button>

          <button
            className="bg-gray-500 text-white px-4 py-2 rounded mt-4"
            onClick={() => {
              setSelectedMode(null);
              setScreen('main');
            }}
          >
            국내/해외 선택화면으로
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
        위탁업체 생성
      </button>
      <button
        className="bg-pink-500 text-white px-4 py-2 rounded"
        onClick={() => setScreen('editCourse')}
      >
        SUBJECT CONTENTS 추가/수정  
      </button>
    </div>

    {/* ✅ 생성된 업체 목록 (다운로드 및 삭제만 가능) */}
    <div className="mt-6 space-y-2">
      <h3 className="text-lg font-semibold">생성된 업체 목록</h3>
      {courseList.map((course, idx) => (
        <div key={idx} className="flex justify-between items-center p-2 border rounded">
          <div>
            <div className="font-semibold">
            {course} ({courseSubjects[course] || "No Subject"})
          </div>
          <div className="text-sm text-gray-500">
            생성일: {courseCreatedDates[course] || 'N/A'}
          </div>
          </div>
          <div className="flex space-x-2">
           {submittedCourses[course] ? (
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => generateCourseExcel(course)}
            >
              다운로드
            </button>
          ) : (
            <span className="text-gray-500 text-sm">제출 전</span>
          )}
            <button
              className="bg-red-500 text-white px-3 py-1 rounded text-sm"
              onClick={async () => {
                if (window.confirm(`${course} 업체를 삭제하시겠습니까?`)) {
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

                  // **Firebase 반영**
                 const collectionName = selectedMode === "domestic" ? "course_domestic" : "course_overseas";
                  await deleteDoc(doc(db, collectionName, course));

                  alert(`${course} 과정이 삭제되었습니다.`);
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
        <h2 className="text-xl font-bold">위탁업체 생성</h2>
        <input
          className="border p-2 w-full"
          placeholder="업체명"
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
          placeholder="업체 강사용 비밀번호"
          value={newCoursePassword}
          onChange={e => setNewCoursePassword(e.target.value)}
        />
        <select
          className="border p-2 w-full"
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
        >
          <option value="">SUBJECT 선택</option>
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

    {/* Step 3: SUBJECT 수정 화면 */}
      {screen === 'editCourse' && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold">SUBJECT 관리</h2>
          <input
            className="border p-2 w-full"
            placeholder="새 SUBJECT명"
            value={newSubjectName}
            onChange={e => setNewSubjectName(e.target.value)}
          />
          <textarea
            className="border p-2 w-full h-24"
            placeholder="CONTENT 내용"
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
            <option value="">SUBJECT 선택</option>
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
          <h2 className="text-2xl font-bold text-center">Instructor Mode</h2>

          <div className="bg-gray-100 p-4 rounded space-y-4">
            <h3 className="text-lg font-semibold">Instructor INFO</h3>
            <input className="border p-2 w-mt2" placeholder="Company Name" value={instructorCompany} onChange={e => setInstructorCompany(e.target.value)} />
            <input className="border p-2 w-mt2" placeholder="Employee ID" value={instructorId} onChange={e => setInstructorId(e.target.value)} />
            <input className="border p-2 w-mt2" placeholder="Name" value={instructorName} onChange={e => setInstructorName(e.target.value)} />
            <input className="border p-2 w-mt2" placeholder="Location" value={instructorLocation} onChange={e => setInstructorLocation(e.target.value)} />
            <label className="block">Signature</label>
            <canvas ref={instructorSigRef}  className="border-2 border-gray-700 bg-white w-full max-w-md aspect-square rounded"
/>
            <button className="bg-gray-400 text-white w-full py-2 rounded" onClick={() => instructorPad.current?.clear()}>Signature Reset</button>
          </div>

          <div className="bg-gray-100 p-4 rounded space-y-4">
            <h3 className="text-lg font-semibold">Trainee INFO</h3>
            <input className="border p-2 w-mt2" placeholder="Team" value={traineeTeam} onChange={e => setTraineeTeam(e.target.value)} />
            <input className="border p-2 w-mt2" placeholder="Employee ID" value={traineeId} onChange={e => setTraineeId(e.target.value)} />
            <input className="border p-2 w-mt2" placeholder="Name" value={traineeName} onChange={e => setTraineeName(e.target.value)} />
            <label className="block">Signature</label>
            <canvas ref={traineeSigRef}  className="border-2 border-gray-700 bg-white w-full max-w-md aspect-square rounded"
/>
            <button className="bg-gray-400 text-white w-full py-2 rounded" onClick={() => traineePad.current?.clear()}>Signature Reset</button>
            <button className="bg-green-500 text-white w-full py-2 rounded" onClick={handleAddTrainee}>Add Trainee</button>
          </div>

          <div className="bg-white p-4 rounded border text-center">
            <h3 className="text-lg font-semibold mb-2">Trainee Status</h3>
            <p className="text-xl">{trainees.length} Completed</p>
            <button
              className="bg-blue-500 text-white w-full py-2 rounded mt-2"
              onClick={() => setScreen('traineeList')}
            >
              View All Trainees
            </button>
          </div>

          <div className="flex space-x-2 items-end">
            <div className="flex-1">
              <label className="block font-medium mb-1">Lecture Date</label>
              <input
                type="text"
                placeholder=""
                className="border p-2 w-full"
                value={lectureDate}
                onChange={e => setLectureDate(e.target.value)}
              />
              <input
                className="border p-2 w-full"
                placeholder="SubmittedDate"
                value={submittedDate}
                onChange={e => setSubmittedDate(e.target.value)}
              />
            </div>

            <button
              className="bg-yellow-400 text-black w-1/2 py-2 rounded"
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>

          <button
            className="bg-gray-400 text-white w-full py-2 rounded mt-2"
            onClick={() => setScreen('main')}
          >
            Main Menu
          </button>
        </div>
      )}

      {/* Step 5: Trainee List Screen */}
        {screen === 'traineeList' && (
        <div className="mt-8 space-y-6">
          <h2 className="text-2xl font-bold text-center">All Trainees</h2>

      <ul className="space-y-2 border p-4 rounded bg-white">
        {trainees.length === 0 ? (
          <p>No trainees registered.</p>
        ) : (
          trainees.map((t, idx) => (
            <li key={idx} className="flex justify-between items-center border-b pb-1">
              <span>{t.team} / {t.id} / {t.name}</span>
              <button
                onClick={() => handleDeleteTrainee(idx)}
                className="text-sm text-red-500"
              >
                Delete
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
        Delete All Trainees
      </button>
    )}

    <button
      className="bg-gray-400 text-white w-full py-2 rounded"
      onClick={() => setScreen('instructor')}
    >
      Back
    </button>
  </div>
)}
    </div>
  );
} 
