// biologyBank.js
// Biology offline bank — 20 chapters, sub-topic tagged (each question has topicId/topicName).
// Provides chapter-level AND sub-topic access. Answers (correctAnswer) are null
// until fetched; they auto-resolve once correct_letter/correct_option_id is filled.

import b1389 from './biology_questions/1389_The_Living_World.json';
import b1390 from './biology_questions/1390_Biological_Classification.json';
import b1391 from './biology_questions/1391_Plant_Kingdom.json';
import b1392 from './biology_questions/1392_Animal_Kingdom.json';
import b1393 from './biology_questions/1393_Morphology_of_Flowering_Plants.json';
import b1394 from './biology_questions/1394_Anatomy_of_Flowering_Plants.json';
import b1395 from './biology_questions/1395_Structural_Organisation_in_Animals.json';
import b1396 from './biology_questions/1396_Cell_The_Unit_of_Life.json';
import b1397 from './biology_questions/1397_Biomolecules.json';
import b1398 from './biology_questions/1398_Cell_Cycle_and_Cell_Division.json';
import b1401 from './biology_questions/1401_Photosynthesis_in_Higher_Plants.json';
import b1402 from './biology_questions/1402_Respiration_in_Plants.json';
import b1403 from './biology_questions/1403_Plant_Growth_and_Development.json';
import b1404 from './biology_questions/1404_Digestion_and_Absorption_FA_ONLY.json';
import b1405 from './biology_questions/1405_Breathing_and_Exchange_of_Gases.json';
import b1406 from './biology_questions/1406_Body_Fluids_and_Circulation.json';
import b1407 from './biology_questions/1407_Excretory_Products_and_their_Elimination.json';
import b1408 from './biology_questions/1408_Locomotion_and_Movement.json';
import b1409 from './biology_questions/1409_Neural_Control_and_Coordination.json';
import b1410 from './biology_questions/1410_Chemical_Coordination_and_Integration.json';

const rawChapters = [b1389, b1390, b1391, b1392, b1393, b1394, b1395, b1396, b1397, b1398, b1401, b1402, b1403, b1404, b1405, b1406, b1407, b1408, b1409, b1410];

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

export const chapters = rawChapters.map((c)=>({
  chapter_id:c.chapter_id,chapter_name:c.chapter_name,count:c.count??(c.questions?c.questions.length:0),
  questions:(c.questions||[]).map(normQ),
}));

export function getChapter(chapterId){return chapters.find(c=>c.chapter_id===Number(chapterId))||null;}
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

export const allQuestions = chapters.flatMap(c=>c.questions.map(q=>({...q,chapterId:c.chapter_id,chapterName:c.chapter_name})));
export const chapterList = chapters.map(c=>({id:c.chapter_id,name:c.chapter_name,count:c.count}));