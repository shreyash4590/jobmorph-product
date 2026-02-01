import { useState, useRef } from 'react';
import { Upload, CheckCircle, XCircle, Download, AlertTriangle, FileText, ExternalLink, Wrench, Eye, ZoomIn, ZoomOut } from 'lucide-react';

export default function ATSChecker() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const previewRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setResult(null);
        setPreview(null);
      } else {
        alert('Please upload PDF or DOCX file only');
      }
    }
  };

  const checkATS = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/ats/check', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log('ATS Check Response:', data);
      
      if (data.is_valid_resume === false) {
        alert(`❌ ${data.issues[0].description}\n\nPlease upload a valid resume file.`);
        setFile(null);
        setResult(null);
        return;
      }
      
      setResult(data);
      
      // ALWAYS load preview (even at 100% score)
      console.log('Loading preview for:', data.temp_file);
      loadPreview(data.temp_file);
      
    } catch (error) {
      console.error('ATS check error:', error);
      alert('Failed to check ATS compatibility. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async (filename) => {
    setLoadingPreview(true);
    console.log('🖼️ Requesting preview for:', filename);
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/ats/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });

      const data = await response.json();
      console.log('Preview response:', data);
      
      if (data.success && data.pages && data.pages.length > 0) {
        setPreview(data.pages);
        setCurrentPage(0);
        console.log('✅ Preview loaded:', data.pages.length, 'pages');
      } else {
        console.error('❌ Preview failed:', data.error || 'No pages');
        // Don't show alert, just log for debugging
      }
    } catch (error) {
      console.error('❌ Preview error:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const fixAndDownload = async () => {
    if (!result) return;

    setFixing(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/ats/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: result.temp_file })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = result.original_extension || '.docx';
        a.download = `${file.name.split('.')[0]}_ATS_Optimized${ext}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('✅ Fixed resume downloaded in original format! All ATS issues resolved.');
      } else {
        alert('Failed to fix resume. Please try again.');
      }
    } catch (error) {
      console.error('Fix error:', error);
      alert('An error occurred while fixing the resume.');
    } finally {
      setFixing(false);
    }
  };

  const scrollToIssue = (issueType) => {
    if (previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Optimized helper functions
  const getScoreColor = (score) => score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
  const getScoreBg = (score) => score >= 80 ? 'bg-green-100' : score >= 60 ? 'bg-yellow-100' : 'bg-red-100';
  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'border-red-500 bg-red-50',
      high: 'border-orange-500 bg-orange-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-blue-500 bg-blue-50'
    };
    return colors[severity] || 'border-gray-500 bg-gray-50';
  };
  const getSeverityIcon = (severity) => {
    const icons = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵' };
    return icons[severity] || '⚪';
  };

  // Resume builder tools (optimized)
  const resumeTools = [
    {
      name: 'Overleaf',
      description: 'LaTeX editor - Perfect for technical resumes',
      icon: '📄',
      url: 'https://www.overleaf.com/latex/templates/tagged/cv',
      color: 'from-green-500 to-green-600',
      bestFor: 'Clean, ATS-friendly formatting',
      type: 'LaTeX Editor'
    },
    {
      name: 'Canva',
      description: 'Easy-to-use design tool with ATS templates',
      icon: '🎨',
      url: 'https://www.canva.com/resumes/templates/',
      color: 'from-purple-500 to-pink-500',
      bestFor: 'Beautiful, professional designs',
      type: 'Design Tool'
    },
    {
      name: 'Resume.io',
      description: 'Pre-made ATS-optimized templates',
      icon: '⚡',
      url: 'https://resume.io/',
      color: 'from-blue-500 to-cyan-500',
      bestFor: 'Quick ATS-friendly resumes',
      type: 'Resume Builder'
    },
    {
      name: 'Novoresume',
      description: 'Modern ATS-compatible templates',
      icon: '✨',
      url: 'https://novoresume.com/',
      color: 'from-orange-500 to-red-500',
      bestFor: 'Modern, clean layouts',
      type: 'Resume Builder'
    }
  ];

  const hasIssues = result?.issues && result.issues.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
            🔍 ATS Format Checker
          </h1>
          <p className="text-gray-600 text-lg">
            See exactly where ATS systems struggle with your resume
          </p>
        </div>

        {/* Upload Section */}
        {!result && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="border-2 border-dashed border-purple-300 rounded-xl p-12 text-center hover:border-purple-500 transition-colors">
              <Upload className="w-16 h-16 mx-auto text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload Your Resume</h3>
              <p className="text-gray-600 mb-4">PDF or DOCX format (Max 10MB)</p>
              
              <label className="inline-block">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg cursor-pointer hover:opacity-90 transition-opacity inline-block">
                  Choose File
                </span>
              </label>

              {file && (
                <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">{file.name}</span>
                </div>
              )}
            </div>

            {file && (
              <button
                onClick={checkATS}
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  <>
                    <Eye className="inline w-5 h-5 mr-2" />
                    Check ATS Compatibility with Visual Preview
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            
            {/* Score Card */}
            <div className={`${getScoreBg(result.score)} rounded-2xl p-6 text-center`}>
              <div className={`text-5xl font-bold ${getScoreColor(result.score)} mb-2`}>
                {result.score}%
              </div>
              <div className="text-lg font-semibold text-gray-700 mb-2">
                ATS Compatibility Score
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full">
                {result.passed ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-600">Passed ATS Check</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-600">Needs Improvement</span>
                  </>
                )}
              </div>
            </div>

            {/* Split Screen: Issues + Preview */}
            <div className="grid lg:grid-cols-5 gap-6">
              
              {/* LEFT: Issues List or Success Message (2/5 width) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                  {hasIssues ? (
                    <>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <XCircle className="w-6 h-6 text-red-500" />
                        {result.issues.length} Issue{result.issues.length !== 1 ? 's' : ''} Found
                      </h2>
                      
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {result.issues.map((issue, idx) => (
                          <div
                            key={idx}
                            className={`border-l-4 ${getSeverityColor(issue.severity)} rounded-lg p-4 cursor-pointer hover:shadow-md transition`}
                            onClick={() => scrollToIssue(issue.type)}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{getSeverityIcon(issue.severity)}</span>
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-800 mb-1">
                                  {issue.title}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                                <button 
                                  className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    scrollToIssue(issue.type);
                                  }}
                                >
                                  <Eye className="w-3 h-3" />
                                  View on Resume →
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Legend */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Color Legend:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {['🔴 Critical', '🟠 High', '🟡 Medium', '🔵 Low'].map((label, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span>{label.split(' ')[0]}</span>
                              <span className="text-gray-600">{label.split(' ')[1]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        Perfect! No Issues Found
                      </h2>
                      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-700">
                          🎉 Your resume is 100% ATS-compatible! All formatting looks great.
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>💡 Pro Tip:</strong> View your resume on the right to confirm everything looks perfect!
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT: Resume Preview (3/5 width) */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <FileText className="w-6 h-6 text-purple-600" />
                      Your Resume {hasIssues && 'with Highlights'}
                    </h2>
                    
                    {preview && preview.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-gray-600 min-w-[50px] text-center">
                          {Math.round(zoom * 100)}%
                        </span>
                        <button
                          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {loadingPreview ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                      <p className="text-gray-600 font-medium">Generating visual preview...</p>
                      <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
                    </div>
                  ) : preview && preview.length > 0 ? (
                    <div className="space-y-4">
                      {/* Page Navigation */}
                      {preview.length > 1 && (
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <button
                            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition"
                          >
                            ← Previous
                          </button>
                          <span className="text-sm font-medium text-gray-600 px-4">
                            Page {currentPage + 1} of {preview.length}
                          </span>
                          <button
                            onClick={() => setCurrentPage(Math.min(preview.length - 1, currentPage + 1))}
                            disabled={currentPage === preview.length - 1}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition"
                          >
                            Next →
                          </button>
                        </div>
                      )}

                      {/* Preview Image */}
                      <div 
                        ref={previewRef}
                        className="border-2 border-gray-200 rounded-lg overflow-auto bg-gray-50 max-h-[700px]"
                      >
                        <img
                          src={preview[currentPage].image}
                          alt={`Resume page ${currentPage + 1}`}
                          className="mx-auto"
                          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                        />
                      </div>

                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                        <p className="text-sm text-gray-700">
                          {hasIssues ? (
                            <>
                              <strong className="text-blue-700">💡 Tip:</strong> Red highlights show exact problem areas that ATS systems cannot read properly. These will be fixed automatically when you download.
                            </>
                          ) : (
                            <>
                              <strong className="text-blue-700">✅ Great!</strong> Your resume looks perfect! This is exactly how ATS systems will see it.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Preview generation in progress...</p>
                      <p className="text-sm text-gray-500">If preview doesn't appear, you can still auto-fix and download your resume.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Manual Fix Tools - Show only if there are issues */}
            {hasIssues && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Wrench className="w-7 h-7 text-indigo-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Fix Your Resume Manually
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Use these professional tools to create an ATS-optimized resume
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {resumeTools.map((tool, idx) => (
                    <a
                      key={idx}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-6 hover:border-transparent hover:shadow-xl transition-all duration-300"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                      
                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-4xl">{tool.icon}</span>
                            <div>
                              <h3 className="text-lg font-bold text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-purple-600 group-hover:to-blue-600 transition-all">
                                {tool.name}
                              </h3>
                              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {tool.type}
                              </span>
                            </div>
                          </div>
                          <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {tool.description}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700 font-medium">{tool.bestFor}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  {result.warnings.length} Warning{result.warnings.length !== 1 ? 's' : ''}
                </h2>
                
                <div className="grid md:grid-cols-2 gap-3">
                  {result.warnings.map((warning, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="text-2xl">{warning.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-800">{warning.title}</h3>
                        <p className="text-sm text-gray-600">{warning.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">
                {hasIssues ? 'Ready to Fix Automatically?' : 'Download Your Perfect Resume'}
              </h3>
              <p className="mb-6 opacity-90">
                {hasIssues 
                  ? 'Download your ATS-optimized resume in the same format you uploaded'
                  : 'Your resume is already ATS-perfect! Download it as-is or get the optimized version.'}
              </p>
              
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={fixAndDownload}
                  disabled={fixing}
                  className="flex-1 min-w-[200px] bg-white text-purple-600 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {fixing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      {hasIssues ? 'Auto-Fix & ' : ''}Download ({result.original_extension?.toUpperCase()})
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                    setPreview(null);
                    setZoom(1);
                    setCurrentPage(0);
                  }}
                  className="px-6 py-4 border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
                >
                  Check Another Resume
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Info Section */}
        {!result && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mt-6">
            <h3 className="text-xl font-bold mb-4">What We Check:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Tables & Graphics', desc: "80% of ATS can't read tables properly" },
                { title: 'Font Compatibility', desc: 'Non-standard fonts cause parsing errors' },
                { title: 'Images & Logos', desc: 'ATS cannot extract text from images' },
                { title: 'Column Layout', desc: 'Multi-column layouts confuse ATS systems' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-sm text-gray-600">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}











// import { useState } from 'react';
// import { Upload, CheckCircle, XCircle, Download, AlertTriangle, FileText, ExternalLink, Wrench } from 'lucide-react';

// export default function ATSChecker() {
//   const [file, setFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [fixing, setFixing] = useState(false);

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0];
//     if (selectedFile) {
//       const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
//       if (validTypes.includes(selectedFile.type)) {
//         setFile(selectedFile);
//         setResult(null);
//       } else {
//         alert('Please upload PDF or DOCX file only');
//       }
//     }
//   };

//   const checkATS = async () => {
//     if (!file) return;

//     setLoading(true);
//     const formData = new FormData();
//     formData.append('resume', file);

//     try {
//       const response = await fetch('http://127.0.0.1:5000/api/ats/check', {
//         method: 'POST',
//         body: formData
//       });

//       const data = await response.json();
      
//       if (data.is_valid_resume === false) {
//         alert(`❌ ${data.issues[0].description}\n\nPlease upload a valid resume file.`);
//         setFile(null);
//         setResult(null);
//         return;
//       }
      
//       setResult(data);
//     } catch (error) {
//       console.error('ATS check error:', error);
//       alert('Failed to check ATS compatibility. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fixAndDownload = async () => {
//     if (!result) return;

//     setFixing(true);

//     try {
//       const response = await fetch('http://127.0.0.1:5000/api/ats/fix', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ filename: result.temp_file })
//       });

//       if (response.ok) {
//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `${file.name.split('.')[0]}_ATS_Optimized.docx`;
//         document.body.appendChild(a);
//         a.click();
//         window.URL.revokeObjectURL(url);
//         document.body.removeChild(a);
        
//         alert('✅ Fixed resume downloaded! All ATS issues have been resolved.');
//       } else {
//         alert('Failed to fix resume. Please try again.');
//       }
//     } catch (error) {
//       console.error('Fix error:', error);
//       alert('An error occurred while fixing the resume.');
//     } finally {
//       setFixing(false);
//     }
//   };

//   const getScoreColor = (score) => {
//     if (score >= 80) return 'text-green-600';
//     if (score >= 60) return 'text-yellow-600';
//     return 'text-red-600';
//   };

//   const getScoreBg = (score) => {
//     if (score >= 80) return 'bg-green-100';
//     if (score >= 60) return 'bg-yellow-100';
//     return 'bg-red-100';
//   };

//   const getSeverityColor = (severity) => {
//     if (severity === 'critical') return 'border-red-500 bg-red-50';
//     if (severity === 'high') return 'border-orange-500 bg-orange-50';
//     if (severity === 'medium') return 'border-yellow-500 bg-yellow-50';
//     return 'border-blue-500 bg-blue-50';
//   };

//   // Resume builder tools data
//   const resumeTools = [
//     {
//       name: 'Overleaf',
//       description: 'LaTeX editor - Perfect for technical resumes',
//       icon: '📄',
//       url: 'https://www.overleaf.com/latex/templates/tagged/cv',
//       color: 'from-green-500 to-green-600',
//       bestFor: 'Clean, ATS-friendly formatting',
//       type: 'LaTeX Editor'
//     },
//     {
//       name: 'Canva',
//       description: 'Easy-to-use design tool with ATS templates',
//       icon: '🎨',
//       url: 'https://www.canva.com/resumes/templates/',
//       color: 'from-purple-500 to-pink-500',
//       bestFor: 'Beautiful, professional designs',
//       type: 'Design Tool'
//     },
//     {
//       name: 'Resume.io',
//       description: 'Pre-made ATS-optimized templates',
//       icon: '⚡',
//       url: 'https://resume.io/',
//       color: 'from-blue-500 to-cyan-500',
//       bestFor: 'Quick ATS-friendly resumes',
//       type: 'Resume Builder'
//     },
//     {
//       name: 'Novoresume',
//       description: 'Modern ATS-compatible templates',
//       icon: '✨',
//       url: 'https://novoresume.com/',
//       color: 'from-orange-500 to-red-500',
//       bestFor: 'Modern, clean layouts',
//       type: 'Resume Builder'
//     }
//   ];

//   // Get smart recommendations based on issues
//   const getRecommendedTools = () => {
//     if (!result || !result.issues) return resumeTools;

//     const issueTypes = result.issues.map(issue => issue.title.toLowerCase());
//     const hasFormatting = issueTypes.some(i => 
//       i.includes('table') || i.includes('column') || i.includes('format')
//     );
//     const hasGraphics = issueTypes.some(i => 
//       i.includes('image') || i.includes('graphic') || i.includes('logo')
//     );

//     // Prioritize Overleaf for formatting issues
//     if (hasFormatting || hasGraphics) {
//       return [resumeTools[0], ...resumeTools.slice(1)]; // Overleaf first
//     }

//     return resumeTools;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
//       <div className="max-w-5xl mx-auto">
        
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
//             🔍 ATS Format Checker
//           </h1>
//           <p className="text-gray-600 text-lg">
//             Ensure your resume passes Applicant Tracking Systems
//           </p>
//         </div>

//         {/* Upload Section */}
//         <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
//           <div className="border-2 border-dashed border-purple-300 rounded-xl p-12 text-center hover:border-purple-500 transition-colors">
//             <Upload className="w-16 h-16 mx-auto text-purple-500 mb-4" />
//             <h3 className="text-xl font-semibold mb-2">Upload Your Resume</h3>
//             <p className="text-gray-600 mb-4">PDF or DOCX format (Max 10MB)</p>
            
//             <label className="inline-block">
//               <input
//                 type="file"
//                 accept=".pdf,.docx"
//                 onChange={handleFileChange}
//                 className="hidden"
//               />
//               <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg cursor-pointer hover:opacity-90 transition-opacity inline-block">
//                 Choose File
//               </span>
//             </label>

//             {file && (
//               <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
//                 <FileText className="w-5 h-5" />
//                 <span className="font-medium">{file.name}</span>
//               </div>
//             )}
//           </div>

//           {file && !result && (
//             <button
//               onClick={checkATS}
//               disabled={loading}
//               className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center gap-2">
//                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                   Analyzing...
//                 </span>
//               ) : (
//                 'Check ATS Compatibility'
//               )}
//             </button>
//           )}
//         </div>

//         {/* Results Section */}
//         {result && (
//           <div className="space-y-6">
            
//             {/* Score Card */}
//             <div className={`${getScoreBg(result.score)} rounded-2xl p-8 text-center`}>
//               <div className={`text-6xl font-bold ${getScoreColor(result.score)} mb-2`}>
//                 {result.score}%
//               </div>
//               <div className="text-xl font-semibold text-gray-700 mb-4">
//                 ATS Compatibility Score
//               </div>
//               <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full">
//                 {result.passed ? (
//                   <>
//                     <CheckCircle className="w-5 h-5 text-green-600" />
//                     <span className="font-medium text-green-600">Passed ATS Check</span>
//                   </>
//                 ) : (
//                   <>
//                     <XCircle className="w-5 h-5 text-red-600" />
//                     <span className="font-medium text-red-600">Needs Improvement</span>
//                   </>
//                 )}
//               </div>
//             </div>

//             {/* Issues */}
//             {result.issues && result.issues.length > 0 && (
//               <div className="bg-white rounded-2xl shadow-lg p-8">
//                 <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
//                   <XCircle className="w-6 h-6 text-red-500" />
//                   {result.issues.length} Issue{result.issues.length !== 1 ? 's' : ''} Found
//                 </h2>
                
//                 <div className="space-y-4">
//                   {result.issues.map((issue, idx) => (
//                     <div key={idx} className={`border-l-4 ${getSeverityColor(issue.severity)} rounded-lg p-6`}>
//                       <div className="flex items-start gap-4">
//                         <span className="text-3xl">{issue.icon}</span>
//                         <div className="flex-1">
//                           <h3 className="text-lg font-bold text-gray-800 mb-2">
//                             Issue #{idx + 1}: {issue.title}
//                           </h3>
//                           <p className="text-gray-700 mb-3">{issue.description}</p>
//                           <div className="bg-white p-3 rounded-lg border border-gray-200">
//                             <p className="text-sm font-semibold text-green-700 mb-1">✅ How we'll fix it:</p>
//                             <p className="text-sm text-gray-600">{issue.fix}</p>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Manual Fix Tools Section - NEW! */}
//             {result.issues && result.issues.length > 0 && (
//               <div className="bg-white rounded-2xl shadow-lg p-8">
//                 <div className="flex items-center gap-3 mb-6">
//                   <Wrench className="w-7 h-7 text-indigo-600" />
//                   <div>
//                     <h2 className="text-2xl font-bold text-gray-800">
//                       Fix Your Resume Manually
//                     </h2>
//                     <p className="text-gray-600 text-sm mt-1">
//                       Use these professional tools to create an ATS-optimized resume
//                     </p>
//                   </div>
//                 </div>

//                 <div className="grid md:grid-cols-2 gap-4 mb-6">
//                   {getRecommendedTools().map((tool, idx) => (
//                     <a
//                       key={idx}
//                       href={tool.url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-6 hover:border-transparent hover:shadow-xl transition-all duration-300"
//                     >
//                       {/* Gradient overlay on hover */}
//                       <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                      
//                       <div className="relative">
//                         <div className="flex items-start justify-between mb-3">
//                           <div className="flex items-center gap-3">
//                             <span className="text-4xl">{tool.icon}</span>
//                             <div>
//                               <h3 className="text-lg font-bold text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-purple-600 group-hover:to-blue-600 transition-all">
//                                 {tool.name}
//                               </h3>
//                               <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
//                                 {tool.type}
//                               </span>
//                             </div>
//                           </div>
//                           <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
//                         </div>
                        
//                         <p className="text-sm text-gray-600 mb-3">
//                           {tool.description}
//                         </p>
                        
//                         <div className="flex items-center gap-2 text-xs">
//                           <CheckCircle className="w-4 h-4 text-green-600" />
//                           <span className="text-gray-700 font-medium">{tool.bestFor}</span>
//                         </div>
//                       </div>
//                     </a>
//                   ))}
//                 </div>

//                 {/* Quick tip based on issues */}
//                 <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 rounded-lg p-4">
//                   <div className="flex items-start gap-3">
//                     <span className="text-2xl">💡</span>
//                     <div>
//                       <p className="font-semibold text-gray-800 mb-1">Pro Tip:</p>
//                       <p className="text-sm text-gray-700">
//                         {result.score < 60 ? (
//                           <>Use <strong>Overleaf</strong> for the cleanest ATS formatting, or <strong>Resume.io</strong> for quick pre-made templates.</>
//                         ) : (
//                           <>Your resume is close! Use any of these tools to make final adjustments and reach 100%.</>
//                         )}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Warnings */}
//             {result.warnings && result.warnings.length > 0 && (
//               <div className="bg-white rounded-2xl shadow-lg p-8">
//                 <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
//                   <AlertTriangle className="w-6 h-6 text-yellow-500" />
//                   {result.warnings.length} Warning{result.warnings.length !== 1 ? 's' : ''}
//                 </h2>
                
//                 <div className="space-y-3">
//                   {result.warnings.map((warning, idx) => (
//                     <div key={idx} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
//                       <span className="text-2xl">{warning.icon}</span>
//                       <div>
//                         <h3 className="font-semibold text-gray-800">{warning.title}</h3>
//                         <p className="text-sm text-gray-600">{warning.description}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Action Buttons */}
//             <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
//               <h3 className="text-2xl font-bold mb-2">Ready to Fix Automatically?</h3>
//               <p className="mb-6 opacity-90">
//                 Click below to automatically fix all issues and download your ATS-optimized resume
//               </p>
              
//               <div className="flex gap-4">
//                 <button
//                   onClick={fixAndDownload}
//                   disabled={fixing}
//                   className="flex-1 bg-white text-purple-600 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
//                 >
//                   {fixing ? (
//                     <>
//                       <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
//                       Fixing...
//                     </>
//                   ) : (
//                     <>
//                       <Download className="w-5 h-5" />
//                       Auto-Fix & Download
//                     </>
//                   )}
//                 </button>
                
//                 <button
//                   onClick={() => {
//                     setFile(null);
//                     setResult(null);
//                   }}
//                   className="px-6 py-4 border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
//                 >
//                   Check Another Resume
//                 </button>
//               </div>
//             </div>

//           </div>
//         )}

//         {/* Info Section */}
//         {!result && (
//           <div className="bg-white rounded-2xl shadow-lg p-8 mt-6">
//             <h3 className="text-xl font-bold mb-4">What We Check:</h3>
//             <div className="grid md:grid-cols-2 gap-4">
//               <div className="flex items-start gap-3">
//                 <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
//                 <div>
//                   <div className="font-semibold">Tables & Graphics</div>
//                   <div className="text-sm text-gray-600">80% of ATS can't read tables properly</div>
//                 </div>
//               </div>
//               <div className="flex items-start gap-3">
//                 <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
//                 <div>
//                   <div className="font-semibold">Font Compatibility</div>
//                   <div className="text-sm text-gray-600">Non-standard fonts cause parsing errors</div>
//                 </div>
//               </div>
//               <div className="flex items-start gap-3">
//                 <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
//                 <div>
//                   <div className="font-semibold">Images & Logos</div>
//                   <div className="text-sm text-gray-600">ATS cannot extract text from images</div>
//                 </div>
//               </div>
//               <div className="flex items-start gap-3">
//                 <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
//                 <div>
//                   <div className="font-semibold">Column Layout</div>
//                   <div className="text-sm text-gray-600">Multi-column layouts confuse ATS systems</div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// }