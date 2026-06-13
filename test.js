const BASE = 'http://localhost:3000';

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { console.log('  PASS  ' + name); pass++; }
  else { console.log('  FAIL  ' + name + (detail ? ' - ' + detail : '')); fail++; }
}

(async () => {
  // 1. create list + 5 items
  const { data: list } = await req('POST', '/lists', { name: 'Test' });
  const items = [];
  for (let i = 1; i <= 5; i++) {
    const r = await req('POST', `/lists/${list.id}/items`, { content: 'Item ' + i });
    items.push(r.data);
  }
  check('1. items have positions 1-5', items.every((it, i) => it.position === i + 1));

  // 2. fetch all, sorted
  let { data: all } = await req('GET', `/lists/${list.id}/items`);
  check('2. items sorted 1-5', all.map(i => i.position).join(',') === '1,2,3,4,5');

  // 4. move pos 3 -> pos 1
  const pos3 = all.find(i => i.position === 3);
  const moved = await req('PATCH', `/lists/${list.id}/items/${pos3.id}/move`, { position: 1 });
  check('4. moved to position 1', moved.data.position === 1);

  // 5. still clean 1-5
  ({ data: all } = await req('GET', `/lists/${list.id}/items`));
  check('5. positions clean 1-5', all.map(i => i.position).join(',') === '1,2,3,4,5');

  // 9. move to 0 -> error
  const r9 = await req('PATCH', `/lists/${list.id}/items/${items[0].id}/move`, { position: 0 });
  check('9. position 0 rejected', r9.status === 400 && !!r9.data?.error);

  // 10. move to 99 -> error
  const r10 = await req('PATCH', `/lists/${list.id}/items/${items[0].id}/move`, { position: 99 });
  check('10. position 99 rejected', r10.status === 400 && !!r10.data?.error);

  // 11. missing item -> 404
  const r11 = await req('GET', `/lists/${list.id}/items/99999`);
  check('11. missing item returns 404', r11.status === 404 && !!r11.data?.error);

  // 12. delete pos 3
  ({ data: all } = await req('GET', `/lists/${list.id}/items`));
  const toDel = all.find(i => i.position === 3);
  const del = await req('DELETE', `/lists/${list.id}/items/${toDel.id}`);
  check('12. delete returns 204', del.status === 204);

  // 13. clean 1-4
  ({ data: all } = await req('GET', `/lists/${list.id}/items`));
  check('13. positions clean 1-4', all.map(i => i.position).join(',') === '1,2,3,4');

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();