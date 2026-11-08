/**
 * Automated Verification Test Suite: Resume PDF Vector Export Engine
 * PR Builder — Client-Side ATS Resume PDF Generation
 */

import {
  generateResumePdfDoc,
  generateResumePdfBlob,
  getResumePdfFilename,
  hasSufficientResumeContent,
} from '../src/services/resumeExportService.ts'
import { SAMPLE_RESUME_DATA, DEFAULT_EMPTY_RESUME } from '../src/pages/Resume/sampleData.ts'

let testsPassed = 0
let testsFailed = 0

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`)
    testsPassed++
  } else {
    console.error(`  ✗ FAIL: ${testName}`)
    testsFailed++
  }
}

console.log('\n======================================================================')
console.log('  PR BUILDER — RESUME PDF VECTOR EXPORT ENGINE TEST SUITE')
console.log('======================================================================\n')

// 1. Content Sufficiency Check
console.log('--- 1. Content Sufficiency Check ---')
assert(hasSufficientResumeContent(SAMPLE_RESUME_DATA) === true, 'Sample resume data passes sufficiency check')
assert(hasSufficientResumeContent(DEFAULT_EMPTY_RESUME) === false, 'Empty resume data fails sufficiency check')
assert(hasSufficientResumeContent({ ...DEFAULT_EMPTY_RESUME, personalInfo: { fullName: 'Test Name' } }) === false, 'Name-only resume requires at least one content section')
assert(hasSufficientResumeContent({
  ...DEFAULT_EMPTY_RESUME,
  personalInfo: { fullName: 'Test Name', title: 'Engineer' },
}) === true, 'Name + Title passes sufficiency check')

// 2. Filename Generation
console.log('--- 2. PDF Filename Generation ---')
assert(getResumePdfFilename(SAMPLE_RESUME_DATA) === 'rahul-sharma-resume.pdf', 'Generates clean sanitized filename from full name')
assert(getResumePdfFilename(SAMPLE_RESUME_DATA, 'Banu Prakash') === 'banu-prakash-resume.pdf', 'Overrides sample placeholder name with authenticated profile name')
assert(getResumePdfFilename(DEFAULT_EMPTY_RESUME, 'Banu Prakash') === 'banu-prakash-resume.pdf', 'Uses authenticated profile name when resume name is blank')
assert(getResumePdfFilename({ ...SAMPLE_RESUME_DATA, personalInfo: { fullName: 'Sai Charan' } }, 'Banu Prakash') === 'sai-charan-resume.pdf', 'Preserves user custom entered name over fallback')
assert(getResumePdfFilename({ ...DEFAULT_EMPTY_RESUME, title: 'My Custom Resume' }) === 'my-custom-resume-resume.pdf', 'Falls back to resume title when name is empty')
assert(getResumePdfFilename(DEFAULT_EMPTY_RESUME) === 'my-professional-resume-resume.pdf', 'Default fallback filename is safe')

// 3. Vector PDF Generation for all Templates
console.log('--- 3. Template-Specific Vector PDF Generation ---')
const templates = ['classic-ats', 'modern', 'technical', 'minimal']

for (const tmpl of templates) {
  const testData = { ...SAMPLE_RESUME_DATA, template: tmpl }
  const doc = generateResumePdfDoc(testData)
  const pageCount = doc.getNumberOfPages()
  const buffer = doc.output('arraybuffer')

  assert(pageCount >= 1, `Template [${tmpl}] renders at least 1 page (actual: ${pageCount})`)
  assert(buffer.byteLength > 5000, `Template [${tmpl}] produces non-empty PDF binary (actual: ${buffer.byteLength} bytes)`)
}

// 4. Blob Generation & MIME Type
console.log('--- 4. Direct PDF Blob Generation ---')
const blob = await generateResumePdfBlob(SAMPLE_RESUME_DATA)
assert(blob instanceof Blob, 'generateResumePdfBlob returns valid Blob instance')
assert(blob.type === 'application/pdf', 'Blob type is application/pdf')
assert(blob.size > 5000, `Blob has expected binary size (${blob.size} bytes)`)

// 5. Handling of Empty / Minimal Resumes Without Crashing
console.log('--- 5. Edge Case: Minimal / Empty Resume Export ---')
const emptyDoc = generateResumePdfDoc(DEFAULT_EMPTY_RESUME)
const emptyBuffer = emptyDoc.output('arraybuffer')
assert(emptyDoc.getNumberOfPages() === 1, 'Empty resume renders 1 page gracefully without throwing')
assert(emptyBuffer.byteLength > 1000, 'Empty resume outputs valid PDF structure')

// Summary
console.log('\n======================================================================')
console.log(`  RESUME PDF EXPORT TEST SUITE: ${testsPassed} PASSED, ${testsFailed} FAILED`)
console.log('======================================================================\n')

if (testsFailed > 0) {
  process.exit(1)
}
