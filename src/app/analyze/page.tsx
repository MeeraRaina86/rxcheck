// In src/app/analyze/page.tsx
const handleAnalysis = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userProfile || !user) {
      setError('Cannot run analysis without a user profile.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAnalysisResult('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          prescription,
          labReport,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalysisResult(data.report);

    } catch (err) {
      if (err instanceof Error) {
        setError(`An error occurred: ${err.message}`);
      } else {
        setError('An unknown error occurred during analysis.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };