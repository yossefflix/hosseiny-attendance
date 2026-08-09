const { createClient } = require('@supabase/supabase-js');

const url = 'https://rqdgwcxnzstnwhweyzlc.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZGd3Y3huenN0bndod2V5emxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNjU5ODcsImV4cCI6MjEwMTg0MTk4N30.68-Zp0RnWydU9WBBvwQ2nsMJlPmzRluCROXzUt8s25Y';

const supabase = createClient(url, key);

async function checkDateType() {
  const { data } = await supabase.from('attendance').select('*');
  console.log('Returned attendance rows from Supabase:', data);
  if (data && data.length > 0) {
    console.log('Date field type & format:', typeof data[0].date, '->', JSON.stringify(data[0].date));
  }
}

checkDateType();
