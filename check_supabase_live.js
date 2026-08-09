const { createClient } = require('@supabase/supabase-js');

const url = 'https://rqdgwcxnzstnwhweyzlc.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZGd3Y3huenN0bndod2V5emxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNjU5ODcsImV4cCI6MjEwMTg0MTk4N30.68-Zp0RnWydU9WBBvwQ2nsMJlPmzRluCROXzUt8s25Y';

const supabase = createClient(url, key);

async function inspectLiveDatabase() {
  console.log('=== INSPECTING LIVE SUPABASE DATABASE ===');

  const { data: emps, error: empErr } = await supabase.from('employees').select('*');
  console.log('Employees in Supabase count:', emps?.length, 'Error:', empErr);
  if (emps && emps.length > 0) {
    console.log('Sample Employee:', emps[0]);
  }

  const { data: atts, error: attErr } = await supabase.from('attendance').select('*');
  console.log('Attendance in Supabase count:', atts?.length, 'Error:', attErr);
  if (atts && atts.length > 0) {
    console.log('All Attendance Records in Supabase:', atts);
  }

  const { data: sets, error: setErr } = await supabase.from('settings').select('*');
  console.log('Settings in Supabase:', sets, 'Error:', setErr);
}

inspectLiveDatabase();
