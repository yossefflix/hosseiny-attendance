const { createClient } = require('@supabase/supabase-js');

const url = 'https://rqdgwcxnzstnwhweyzlc.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZGd3Y3huenN0bndod2V5emxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNjU5ODcsImV4cCI6MjEwMTg0MTk4N30.68-Zp0RnWydU9WBBvwQ2nsMJlPmzRluCROXzUt8s25Y';

const supabase = createClient(url, key);

async function testUpsert() {
  console.log('Testing Attendance Upsert...');
  const { data, error } = await supabase.from('attendance').upsert({
    id: `att-${Date.now()}`,
    employee_id: 'emp-2',
    date: '2026-08-09',
    check_in_time: '09:45:00',
    original_check_in_time: '09:45:00',
    status: 'present',
    edited: false
  }, { onConflict: 'employee_id,date' }).select();

  console.log('Upsert result for emp-2:', { data, error });
}

testUpsert();
