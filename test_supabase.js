const { createClient } = require('@supabase/supabase-js');

const url = 'https://rqdgwcxnzstnwhweyzlc.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZGd3Y3huenN0bndod2V5emxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNjU5ODcsImV4cCI6MjEwMTg0MTk4N30.68-Zp0RnWydU9WBBvwQ2nsMJlPmzRluCROXzUt8s25Y';

const supabase = createClient(url, key);

async function testInsert() {
  const { data, error } = await supabase.from('employees').insert([
    { id: '1', name: 'تجربة', job_title: 'فني' }
  ]);
  console.log('Insert test with string ID "1":', { data, error });
}

testInsert();
