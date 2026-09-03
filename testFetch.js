fetch('http://localhost:3000/api/pagamentos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
}).then(res => res.json()).then(console.log).catch(console.error);
