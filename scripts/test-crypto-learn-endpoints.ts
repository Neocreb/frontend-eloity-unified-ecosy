import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const apiBase = process.env.API_BASE_URL || 'http://localhost:5000';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function test(
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, status: 'PASS', duration: Date.now() - start });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      status: 'FAIL',
      error: (error as Error).message,
      duration: Date.now() - start,
    });
    console.log(`❌ ${name}: ${(error as Error).message}`);
  }
}

async function runTests() {
  console.log('\n🧪 CRYPTO LEARN API ENDPOINT TESTS\n');
  console.log(`API Base: ${apiBase}`);
  console.log(`Supabase URL: ${supabaseUrl}\n`);

  // Get auth token
  let authToken = '';
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  console.log('📝 Setting up test user...\n');

  // Sign up test user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpError) {
    console.error('❌ Failed to create test user:', signUpError.message);
    process.exit(1);
  }

  if (!signUpData.session) {
    console.error('❌ No session returned from signup');
    process.exit(1);
  }

  authToken = signUpData.session.access_token;
  const userId = signUpData.user?.id;

  console.log(`✅ Test user created: ${testEmail}\n`);

  // Test variables
  let courseId = '';
  let lessonId = '';
  let articleId = '';
  let enrollmentId = '';

  // ============================================================================
  // COURSE ENDPOINTS TESTS
  // ============================================================================

  console.log('\n📚 TESTING COURSE ENDPOINTS\n');

  // Test: List courses
  await test('GET /api/courses - List published courses', async () => {
    const response = await fetch(`${apiBase}/api/courses`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Expected array');
  });

  // Test: Get course
  await test('GET /api/courses/:id - Get course details', async () => {
    const response = await fetch(`${apiBase}/api/courses`);
    const courses = await response.json();
    if (courses.length === 0) throw new Error('No courses to test');
    courseId = courses[0].id;

    const detailResponse = await fetch(`${apiBase}/api/courses/${courseId}`);
    if (!detailResponse.ok) throw new Error(`HTTP ${detailResponse.status}`);
    const course = await detailResponse.json();
    if (!course.id) throw new Error('Missing course ID');
  });

  // Test: Enroll in course
  await test('POST /api/courses/:id/enroll - Enroll in course', async () => {
    const response = await fetch(`${apiBase}/api/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok && response.status !== 400) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (data.data?.id) enrollmentId = data.data.id;
  });

  // Test: Check enrollment
  await test('GET /api/courses/:id/enrollment - Check enrollment status', async () => {
    const response = await fetch(`${apiBase}/api/courses/${courseId}/enrollment`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (typeof data.enrolled !== 'boolean') throw new Error('Missing enrolled status');
  });

  // Test: Get progress
  await test('GET /api/courses/:id/progress - Get course progress', async () => {
    const response = await fetch(`${apiBase}/api/courses/${courseId}/progress`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    // 404 is expected if not enrolled
    if (response.status !== 404 && !response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  });

  // Test: Get user stats
  await test('GET /api/courses/user/stats - Get course statistics', async () => {
    const response = await fetch(`${apiBase}/api/courses/user/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (typeof data.totalCourses !== 'number') throw new Error('Missing stats');
  });

  // Test: Get user enrollments
  await test('GET /api/courses/user/enrollments - Get user enrollments', async () => {
    const response = await fetch(`${apiBase}/api/courses/user/enrollments`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Expected array');
  });

  // ============================================================================
  // ARTICLE ENDPOINTS TESTS
  // ============================================================================

  console.log('\n📰 TESTING ARTICLE ENDPOINTS\n');

  // Test: List articles
  await test('GET /api/articles - List published articles', async () => {
    const response = await fetch(`${apiBase}/api/articles`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Expected array');
  });

  // Test: Get article
  await test('GET /api/articles/:id - Get article details', async () => {
    const response = await fetch(`${apiBase}/api/articles`);
    const articles = await response.json();
    if (articles.length === 0) {
      console.log('⏭️  Skipping article detail test (no articles)');
      return;
    }
    articleId = articles[0].id;

    const detailResponse = await fetch(`${apiBase}/api/articles/${articleId}`);
    if (!detailResponse.ok) throw new Error(`HTTP ${detailResponse.status}`);
    const article = await detailResponse.json();
    if (!article.id) throw new Error('Missing article ID');
  });

  if (articleId) {
    // Test: Mark article read
    await test('POST /api/articles/:id/read - Mark article read', async () => {
      const response = await fetch(`${apiBase}/api/articles/${articleId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeSpent: 5 }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    });

    // Test: Get article progress
    await test('GET /api/articles/:id/progress - Get article progress', async () => {
      const response = await fetch(`${apiBase}/api/articles/${articleId}/progress`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (typeof data.read !== 'boolean') throw new Error('Missing read status');
    });

    // Test: Bookmark article
    await test('POST /api/articles/:id/bookmark - Bookmark article', async () => {
      const response = await fetch(`${apiBase}/api/articles/${articleId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookmarked: true }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    });

    // Test: Like article
    await test('POST /api/articles/:id/like - Like article', async () => {
      const response = await fetch(`${apiBase}/api/articles/${articleId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ liked: true }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    });

    // Test: Submit quiz
    await test('POST /api/articles/:id/quiz - Submit quiz', async () => {
      const response = await fetch(`${apiBase}/api/articles/${articleId}/quiz`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score: 85 }),
      });
      if (!response.ok && response.status !== 400) {
        throw new Error(`HTTP ${response.status}`);
      }
    });

    // Test: Get user article progress
    await test('GET /api/articles/user/progress - Get user article progress', async () => {
      const response = await fetch(`${apiBase}/api/articles/user/progress`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Expected array');
    });
  }

  // ============================================================================
  // CREATOR COURSE ENDPOINTS TESTS
  // ============================================================================

  console.log('\n🎓 TESTING CREATOR COURSE ENDPOINTS\n');

  let creatorCourseId = '';

  // Test: Create creator course
  await test('POST /api/creator/courses - Create course', async () => {
    const response = await fetch(`${apiBase}/api/creator/courses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Creator Course',
        description: 'A test course created by user',
        level: 'Beginner',
        category: 'Trading',
        duration: '2 hours',
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.data?.id) creatorCourseId = data.data.id;
  });

  // Test: Get creator courses
  await test('GET /api/creator/courses - List user courses', async () => {
    const response = await fetch(`${apiBase}/api/creator/courses`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Expected array');
  });

  if (creatorCourseId) {
    // Test: Get creator course
    await test('GET /api/creator/courses/:id - Get course details', async () => {
      const response = await fetch(`${apiBase}/api/creator/courses/${creatorCourseId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data.id) throw new Error('Missing course ID');
    });

    // Test: Update creator course
    await test('PUT /api/creator/courses/:id - Update course', async () => {
      const response = await fetch(`${apiBase}/api/creator/courses/${creatorCourseId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: 'Updated description' }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    });

    // Test: Publish course
    await test('POST /api/creator/courses/:id/publish - Publish course', async () => {
      const response = await fetch(`${apiBase}/api/creator/courses/${creatorCourseId}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    });

    // Test: Get course stats
    await test('GET /api/creator/courses/:id/stats - Get course stats', async () => {
      const response = await fetch(
        `${apiBase}/api/creator/courses/${creatorCourseId}/stats`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` },
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (typeof data.totalEnrollments !== 'number') throw new Error('Missing stats');
    });

    // Test: Delete course
    await test('DELETE /api/creator/courses/:id - Delete course', async () => {
      const response = await fetch(`${apiBase}/api/creator/courses/${creatorCourseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    });
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const total = results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms\n`);

  if (failed > 0) {
    console.log('Failed Tests:\n');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`  ❌ ${r.name}`);
        console.log(`     Error: ${r.error}\n`);
      });
  }

  // Success rate
  const successRate = ((passed / total) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%\n`);

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Implementation is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }

  // Cleanup
  console.log('🧹 Cleaning up test user...');
  await supabase.auth.admin.deleteUser(userId!);
  console.log('✅ Cleanup complete\n');
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
