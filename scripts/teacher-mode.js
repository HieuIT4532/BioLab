/* ============================================================
   BioLab X — Teacher Mode
   🏫 Classroom management, assignments, student tracking
   ============================================================ */

const BioLabTeacher = (() => {
  const CLASSES_KEY = 'biolab_classes';

  const VIET_FIRST = ['An','Bình','Chi','Dũng','Phúc','Giang','Hà','Khánh','Linh','Mai','Nam','Oanh','Phương','Quỳnh','Sơn','Thảo','Uyên','Vân','Yến','Đức','Huy','Tùng','Ngọc','Trâm','Minh','Tuấn','Hồng','Lan','Anh','Trang'];
  const VIET_LAST = ['Nguyễn','Trần','Lê','Phạm','Hoàng','Huỳnh','Phan','Vũ','Võ','Đặng','Bùi','Đỗ'];

  function getClasses() {
    try { return JSON.parse(localStorage.getItem(CLASSES_KEY) || '[]'); } catch { return []; }
  }

  function saveClasses(cls) {
    localStorage.setItem(CLASSES_KEY, JSON.stringify(cls));
    if (window.BioLabFirebase?.isOnline()) {
      const u = BioLabFirebase.Auth.getUser();
      if (u) BioLabFirebase.DB.set(`teachers/${u.uid}/classes`, cls);
    }
  }

  function createClass(name, grade, school) {
    const classes = getClasses();
    const c = {
      id: 'class_' + Date.now(),
      name, grade: grade||'10', school: school||'',
      createdAt: new Date().toISOString(),
      students: _mockStudents(30 + Math.floor(Math.random()*15)),
      assignments: [], announcements: []
    };
    classes.push(c);
    saveClasses(classes);
    return c;
  }

  function getClass(id) { return getClasses().find(c=>c.id===id); }
  function deleteClass(id) { saveClasses(getClasses().filter(c=>c.id!==id)); }

  function createAssignment(classId, a) {
    const classes = getClasses();
    const cls = classes.find(c=>c.id===classId);
    if(!cls) return null;
    const assign = {
      id:'assign_'+Date.now(), title:a.title, description:a.description||'',
      zone:a.zone||'experiment', type:a.type||'experiment',
      deadline:a.deadline||null, maxScore:a.maxScore||100,
      createdAt:new Date().toISOString(),
      submissions: _mockSubmissions(cls.students, a.type), status:'active'
    };
    cls.assignments.push(assign);
    saveClasses(classes);
    return assign;
  }

  function getStudentProgress(classId) {
    const cls = getClass(classId);
    if(!cls) return [];
    return cls.students.map(s => {
      const subs = [];
      cls.assignments.forEach(a => {
        const sub = a.submissions.find(x=>x.studentId===s.id);
        if(sub) subs.push({...sub, assignmentTitle:a.title});
      });
      return { ...s, totalSubmissions:subs.length,
        avgScore: subs.length>0 ? Math.round(subs.reduce((a,x)=>a+(x.score||0),0)/subs.length) : 0,
        submissions: subs
      };
    });
  }

  function generateReport(classId) {
    const cls = getClass(classId);
    if(!cls) return null;
    const students = getStudentProgress(classId);
    const avg = (arr, fn) => Math.round(arr.reduce((a,s)=>a+fn(s),0)/arr.length);
    return {
      className:cls.name, grade:cls.grade, school:cls.school,
      totalStudents:students.length,
      avgLevel: avg(students, s=>s.level),
      avgXP: avg(students, s=>s.totalXP),
      avgScore: avg(students, s=>s.avgScore),
      competencies: {
        biologicalKnowledge: avg(students, s=>s.competencies.biologicalKnowledge),
        experimentalSkills: avg(students, s=>s.competencies.experimentalSkills),
        scientificThinking: avg(students, s=>s.competencies.scientificThinking),
        problemSolving: avg(students, s=>s.competencies.problemSolving)
      },
      topStudents: [...students].sort((a,b)=>b.totalXP-a.totalXP).slice(0,5),
      needHelp: students.filter(s=>s.avgScore<50||s.level<2),
      assignmentCount: cls.assignments.length,
      generatedAt: new Date().toISOString()
    };
  }

  function _mockStudents(n) {
    const arr = [];
    for(let i=0;i<n;i++){
      const fn=VIET_FIRST[i%VIET_FIRST.length], ln=VIET_LAST[i%VIET_LAST.length];
      const lv = 1+Math.floor(Math.random()*8);
      arr.push({
        id:'stu_'+Date.now()+'_'+i, name:`${ln} ${fn}`,
        avatar:['🧬','🔬','🧪','📊','🌿','💡'][i%6], level:lv,
        totalXP:lv*100+Math.floor(Math.random()*200),
        experimentCount:Math.floor(Math.random()*20),
        competencies:{
          biologicalKnowledge:20+Math.floor(Math.random()*70),
          experimentalSkills:15+Math.floor(Math.random()*75),
          scientificThinking:10+Math.floor(Math.random()*65),
          problemSolving:10+Math.floor(Math.random()*60)
        },
        lastActive:new Date(Date.now()-Math.random()*7*864e5).toISOString(),
        status:Math.random()>0.15?'active':'inactive'
      });
    }
    return arr.sort((a,b)=>a.name.localeCompare(b.name,'vi'));
  }

  function _mockSubmissions(students, type) {
    return students.filter(()=>Math.random()>0.2).map(s=>({
      studentId:s.id, studentName:s.name,
      submittedAt:new Date(Date.now()-Math.random()*5*864e5).toISOString(),
      score: type==='quiz' ? 40+Math.floor(Math.random()*61) : 30+Math.floor(Math.random()*71),
      status:Math.random()>0.1?'graded':'pending',
      feedback:Math.random()>0.3?'Làm tốt, cần cải thiện phần phân tích.':''
    }));
  }

  return { getClasses, createClass, getClass, deleteClass, createAssignment, getStudentProgress, generateReport };
})();

if(typeof window!=='undefined') window.BioLabTeacher = BioLabTeacher;
