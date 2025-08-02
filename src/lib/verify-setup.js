// Utility to verify Phase 1 setup is complete
export function verifyPhase1Setup() {
  const checks = {
    envVars: {
      name: 'Environment Variables',
      status: false,
      details: []
    },
    dependencies: {
      name: 'Dependencies',
      status: false,
      details: []
    },
    supabaseClient: {
      name: 'Supabase Client',
      status: false,
      details: []
    }
  }

  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      checks.envVars.details.push(`✅ ${envVar}`)
    } else {
      checks.envVars.details.push(`❌ ${envVar} - Missing`)
    }
  })

  checks.envVars.status = requiredEnvVars.every(envVar => process.env[envVar])

  // Check if we can import Supabase
  try {
    require('@supabase/supabase-js')
    checks.dependencies.details.push('✅ @supabase/supabase-js')
    checks.dependencies.status = true
  } catch (error) {
    checks.dependencies.details.push('❌ @supabase/supabase-js - Not installed')
    checks.dependencies.status = false
  }

  // Check Supabase client
  try {
    const { supabase } = require('./supabase')
    if (supabase) {
      checks.supabaseClient.details.push('✅ Supabase client created')
      checks.supabaseClient.status = true
    }
  } catch (error) {
    checks.supabaseClient.details.push(`❌ Supabase client error: ${error.message}`)
    checks.supabaseClient.status = false
  }

  const allPassed = Object.values(checks).every(check => check.status)

  return {
    allPassed,
    checks,
    summary: {
      passed: Object.values(checks).filter(check => check.status).length,
      total: Object.values(checks).length
    }
  }
}

// Phase 1 completion status
export const PHASE_1_TASKS = [
  '✅ Install Supabase dependencies',
  '✅ Configure environment variables',
  '✅ Setup Supabase client (browser & server)',
  '✅ Create connection test utilities',
  '✅ Create test page for verification',
  '🔄 Verify connection works in browser'
]

export function getPhase1Status() {
  const verification = verifyPhase1Setup()
  
  return {
    completed: verification.allPassed,
    progress: `${verification.summary.passed}/${verification.summary.total}`,
    nextSteps: verification.allPassed ? 
      ['🚀 Ready for Phase 2: Authentication System'] :
      ['🔧 Fix setup issues before proceeding'],
    verification
  }
}