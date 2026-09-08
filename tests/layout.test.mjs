import test from 'node:test';
import assert from 'node:assert/strict';
import { boCuc, ve } from '../public/assets/cay.js';
const person = (id, cha_id=null, me_id=null) => ({id, ho_ten:'Người '+id, cha_id, me_id, gioi_tinh:'nam'});
for (const doc of [false,true]) {
  test(`Only child: couple and single parent, portrait=${doc}`, () => {
    for (const couple of [false,true]) {
      const people = couple ? [person(1),person(2),person(3,1,2)] : [person(1),person(3,1)];
      const data = boCuc(people,[],doc), edge=data.canhCon[0];
      assert.equal(data.canhCon.length,1);
      assert.deepEqual(edge.parents,couple?[1,2]:[1]);
      const child=data.nodes.find(n=>n.n.id===3);
      assert.equal(edge.con[0],child.x+data.size.W/2);
      assert.equal(edge.y2,child.y);
      const svg=ve(data);
      assert.match(svg,/class="canh-con"[^>]+d="M[^"]+ V[^ ]+ H[^ ]+ V[^ ]+"/);
      assert.ok(edge.y < edge.y2);
    }
  });
  test(`Multiple spouses keep children attached to correct parents, portrait=${doc}`, () => {
    const people=[person(1),person(2),person(3),person(4,1,2),person(5,1,3)];
    const data=boCuc(people,[{chong_id:1,vo_id:2},{chong_id:1,vo_id:3}],doc);
    assert.deepEqual(data.canhCon.find(e=>e.childId===4).parents,[1,2]);
    assert.deepEqual(data.canhCon.find(e=>e.childId===5).parents,[1,3]);
    assert.equal(new Set(data.nodes.map(n=>n.n.id)).size,5);
    for(const e of data.canhCon) for(const id of e.parents) assert.ok(data.nodes.some(n=>n.n.id===id));
  });
}
test('Portrait reduces tree width; card labels are escaped',()=>{
 const people=[person(1),person(2),person(3,1,2)];
 people[0].ho_ten='<img onerror=alert(1)>';
 const wide=boCuc(people,[]), compact=boCuc(people,[],true);
 const width=d=>Math.max(...d.nodes.map(n=>n.x+d.size.W));
 assert.ok(width(compact)<width(wide));
 assert.ok(!ve(compact).includes('<img onerror'));
});
