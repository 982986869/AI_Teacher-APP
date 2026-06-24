// biologyBank.js
// Biology offline bank — 20 chapters, sub-topic tagged (each question has topicId/topicName).
// Provides chapter-level AND sub-topic access. Answers (correctAnswer) are null
// until fetched; they auto-resolve once correct_letter/correct_option_id is filled.

// Chapter metadata — lightweight. Each chapter's JSON is loaded LAZILY (only when
// that chapter is actually opened) via a static require() string, so the app does
// not parse the whole multi-MB question bank into memory at startup.
const META = [
  { id: 1389, name: "The Living World", count: 146, load: () => require("./biology_questions/1389_The_Living_World.json") },
  { id: 1390, name: "Biological Classification", count: 541, load: () => require("./biology_questions/1390_Biological_Classification.json") },
  { id: 1391, name: "Plant Kingdom", count: 462, load: () => require("./biology_questions/1391_Plant_Kingdom.json") },
  { id: 1392, name: "Animal Kingdom", count: 557, load: () => require("./biology_questions/1392_Animal_Kingdom.json") },
  { id: 1393, name: "Morphology of Flowering Plants", count: 421, load: () => require("./biology_questions/1393_Morphology_of_Flowering_Plants.json") },
  { id: 1394, name: "Anatomy of Flowering Plants", count: 158, load: () => require("./biology_questions/1394_Anatomy_of_Flowering_Plants.json") },
  { id: 1395, name: "Structural Organisation in Animals", count: 43, load: () => require("./biology_questions/1395_Structural_Organisation_in_Animals.json") },
  { id: 1396, name: "Cell The Unit of Life", count: 518, load: () => require("./biology_questions/1396_Cell_The_Unit_of_Life.json") },
  { id: 1397, name: "Biomolecules", count: 353, load: () => require("./biology_questions/1397_Biomolecules.json") },
  { id: 1398, name: "Cell Cycle and Cell Division", count: 400, load: () => require("./biology_questions/1398_Cell_Cycle_and_Cell_Division.json") },
  { id: 1401, name: "Photosynthesis in Higher Plants", count: 493, load: () => require("./biology_questions/1401_Photosynthesis_in_Higher_Plants.json") },
  { id: 1402, name: "Respiration in Plants", count: 348, load: () => require("./biology_questions/1402_Respiration_in_Plants.json") },
  { id: 1403, name: "Plant Growth and Development", count: 295, load: () => require("./biology_questions/1403_Plant_Growth_and_Development.json") },
  { id: 1404, name: "Digestion and Absorption (FA ONLY)", count: 386, load: () => require("./biology_questions/1404_Digestion_and_Absorption_FA_ONLY.json") },
  { id: 1405, name: "Breathing and Exchange of Gases", count: 336, load: () => require("./biology_questions/1405_Breathing_and_Exchange_of_Gases.json") },
  { id: 1406, name: "Body Fluids and Circulation", count: 379, load: () => require("./biology_questions/1406_Body_Fluids_and_Circulation.json") },
  { id: 1407, name: "Excretory Products and their Elimination", count: 334, load: () => require("./biology_questions/1407_Excretory_Products_and_their_Elimination.json") },
  { id: 1408, name: "Locomotion and Movement", count: 346, load: () => require("./biology_questions/1408_Locomotion_and_Movement.json") },
  { id: 1409, name: "Neural Control and Coordination", count: 190, load: () => require("./biology_questions/1409_Neural_Control_and_Coordination.json") },
  { id: 1410, name: "Chemical Coordination and Integration", count: 419, load: () => require("./biology_questions/1410_Chemical_Coordination_and_Integration.json") },
];

const LETTERS = 'ABCDEFGHIJ'.split('');

function decodeEntities(s){return s.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;|&rsquo;|&lsquo;/g,"'").replace(/&ldquo;|&rdquo;/g,'"').replace(/&deg;/g,'\u00B0').replace(/&times;/g,'\u00D7').replace(/&rarr;/g,'\u2192').replace(/&harr;/g,'\u2194').replace(/&#(\d+);/g,(m,n)=>String.fromCharCode(Number(n)));}
const BRACE='\\{((?:[^{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})*)\\}';
function latexToText(t){let s=t.replace(/\\rightarrow|\\to/g,'\u2192').replace(/\\times/g,'\u00D7').replace(/\\left|\\right/g,'');for(let p=0;p<4;p++){s=s.replace(new RegExp('\\\\frac\\s*'+BRACE+'\\s*'+BRACE,'g'),'($1)/($2)');s=s.replace(new RegExp('\\\\sqrt\\s*'+BRACE,'g'),'\u221A($1)');s=s.replace(new RegExp('\\^'+BRACE,'g'),'^($1)');s=s.replace(new RegExp('_'+BRACE,'g'),'_($1)');}return s.replace(/\\[a-zA-Z]+/g,'').replace(/[{}]/g,'');}
function clean(html){if(html==null)return '';let s=String(html).replace(/\{tex\}([\s\S]*?)\{\/tex\}/g,(m,t)=>latexToText(t)).replace(/<sup[^>]*>([\s\S]*?)<\/sup>/g,'^($1)').replace(/<sub[^>]*>([\s\S]*?)<\/sub>/g,'_($1)').replace(/<br\s*\/?>/g,' ').replace(/<[^>]+>/g,'');return decodeEntities(s).replace(/\s+/g,' ').trim();}

function normQ(q){
  const options=(q.options||[]).map((o,i)=>({key:LETTERS[i],label:clean(o.option??o.text??''),optionId:o.id??null}));
  let correctAnswer=null;
  if(q.correct_letter){correctAnswer=String(q.correct_letter).toUpperCase();}
  else if(q.correct_option_id!=null){const idx=options.findIndex(o=>String(o.optionId)===String(q.correct_option_id));if(idx>=0)correctAnswer=LETTERS[idx];}
  return {id:q.id,text:clean(q.question??q.text??''),difficulty:q.difficulty_label??q.difficulty??null,
    topicId:q.topicId??null,topicName:q.topicName??null,options,correctAnswer,explanation:clean(q.explanation??'')};
}

// Cheap, synchronous list for the chapter pickers (no JSON parsed).
export const chapterList = META.map((m)=>({id:m.id,name:m.name,count:m.count}));

// Lazily build + cache a chapter's normalized questions on first access.
const _chapterCache={};
function buildChapter(meta){
  if(_chapterCache[meta.id])return _chapterCache[meta.id];
  const raw=meta.load()||{};
  const ch={chapter_id:meta.id,chapter_name:meta.name,count:meta.count??(raw.questions?raw.questions.length:0),
    questions:(raw.questions||[]).map(normQ)};
  _chapterCache[meta.id]=ch;
  return ch;
}

export function getChapter(chapterId){const meta=META.find(m=>m.id===Number(chapterId));return meta?buildChapter(meta):null;}
export function getQuestions(chapterId){const ch=getChapter(chapterId);return ch?ch.questions:[];}

// sub-topics derived from the questions' topicId/topicName
export function getSubtopics(chapterId){
  const ch=getChapter(chapterId);if(!ch)return [];
  const map=new Map();
  ch.questions.forEach(q=>{if(q.topicId==null)return;const k=String(q.topicId);if(!map.has(k))map.set(k,{topicId:q.topicId,topicName:q.topicName,count:0});map.get(k).count++;});
  return Array.from(map.values());
}
export function getSubtopicQuestions(chapterId,topicId){
  const ch=getChapter(chapterId);if(!ch)return [];
  return ch.questions.filter(q=>String(q.topicId)===String(topicId));
}

// All questions across every chapter — lazy (parses all chapters on call). Nothing
// imports this at startup; kept for compatibility.
export function getAllQuestions(){
  return META.flatMap(m=>{const ch=buildChapter(m);return ch.questions.map(q=>({...q,chapterId:ch.chapter_id,chapterName:ch.chapter_name}));});
}