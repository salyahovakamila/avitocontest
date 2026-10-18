/* Simple offline smoke tests (Node.js 18+) for ranking and application state. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const content=fs.readFileSync(path.join(root,'app.js'),'utf8');
const store=new Map(),elements=new Map(),navs=[];
class FakeElement{
 constructor(name=''){this.name=name;this.dataset={};this.value='';this.textContent='';this.innerHTML='';this.hidden=true;this.handlers={};this.style={};this.classList={add(){},remove(){},toggle(){},contains(){return false}};}
 addEventListener(type,fn){this.handlers[type]=fn;}
 focus(){} close(){} showModal(){} scrollTo(){} querySelector(){return null;}
}
for(const v of ['dashboard','tasks','calendar','analytics']){let e=new FakeElement(v);e.dataset.view=v;navs.push(e);}
const document={getElementById(name){if(!elements.has(name))elements.set(name,new FakeElement(name));return elements.get(name);},querySelectorAll(q){return q==='.nav-item'?navs:[];},querySelector(){return new FakeElement('sidebar');}};
const localStorage={getItem(key){return store.get(key)??null;},setItem(key,val){store.set(key,String(val));}};
const context=vm.createContext({console,Math,Date,Number,String,Object,Array,Intl,JSON,localStorage,document,window:{scrollTo(){}},confirm:()=>true,clearTimeout:()=>{},setTimeout:()=>0});
vm.runInContext(content,context);
const expr=x=>vm.runInContext(x,context);
assert.equal(expr('tasks.length'),7,'Demo seed should provide seven sample tasks');
assert.match(elements.get('mainContent').innerHTML,/СЕГОДНЯ ЛУЧШЕ НАЧАТЬ С/);
const urgent=expr('score({...tasks[0],due:shiftDate(0)})');
const far=expr('score({...tasks[0],due:shiftDate(12)})');
assert.ok(urgent>far,'Due date must affect priority');
assert.equal(expr('score({...tasks[0],completed:true})'),0);
assert.ok(expr('topActive().every(t=>!t.completed)'), 'Top tasks should exclude completed');
expr('navTo("calendar")');
assert.equal((elements.get('mainContent').innerHTML.match(/class="week-day /g)||[]).length,7);
expr('navTo("tasks")');
assert.match(elements.get('mainContent').innerHTML,/task-row/);
// Simulate form creation.
expr("openDialog()");
elements.get('fTitle').value='Тестовая задача';
elements.get('fSubject').value='Тест';
elements.get('fDue').value='2026-10-19';
elements.get('fHours').value='2';
elements.get('fDifficulty').value='4';
elements.get('fImportance').value='3';
elements.get('fNotes').value='Моя заметка';
const form=elements.get('taskForm');
form.handlers.submit({preventDefault(){}});
assert.equal(expr('tasks.length'),8);
assert.ok(expr('tasks.some(t=>t.title==="Тестовая задача")'));
assert.ok(JSON.parse(store.get('bez-dedlainov-tasks-v1')).length===8);
// Simulate editing existing task.
expr('openDialog(tasks.find(t=>t.title==="Тестовая задача"))');
elements.get('fTitle').value='Изменённая задача';
form.handlers.submit({preventDefault(){}});
assert.ok(expr('tasks.some(t=>t.title==="Изменённая задача")'));
assert.equal(expr('tasks.length'),8);
console.log('OK: seed, ranking, completion, calendar, tasks, create/edit and localStorage');
