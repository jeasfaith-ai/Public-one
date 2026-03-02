import { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

interface OnboardingTourProps {
  user: any;
}

export default function OnboardingTour({ user }: OnboardingTourProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Check if user is logged in and hasn't seen the tour
    const hasSeenTour = localStorage.getItem(`tour_seen_${user?.id}`);
    if (user && !hasSeenTour) {
      setRun(true);
    }
  }, [user]);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-left">
          <h3 className="text-lg font-bold text-emerald-700 mb-2">Welcome to Stress No More! 🎓</h3>
          <p className="text-slate-600">Let's take a quick tour to show you how to use the platform to your advantage.</p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '#generate-topic-btn',
      content: (
        <div className="text-left">
          <h3 className="text-lg font-bold text-emerald-700 mb-2">Generate Project Topics</h3>
          <p className="text-slate-600">Don't have a topic yet? Click here to generate unique, department-specific topics tailored for you.</p>
        </div>
      ),
    },
    {
      target: '#write-project-btn',
      content: (
        <div className="text-left">
          <h3 className="text-lg font-bold text-emerald-700 mb-2">Write Your Project</h3>
          <p className="text-slate-600">Already have a topic? Use our Stress no more assistant to write your full project chapters, from Abstract to References.</p>
        </div>
      ),
    },
    {
      target: '#defend-project-btn',
      content: (
        <div className="text-left">
          <h3 className="text-lg font-bold text-emerald-700 mb-2">Defend Like a Pro</h3>
          <p className="text-slate-600">Generate a professional defense script and Q&A guide for your project.</p>
        </div>
      ),
    },
    {
      target: '#generate-ppt-btn',
      content: (
        <div className="text-left">
          <h3 className="text-lg font-bold text-emerald-700 mb-2">Generate PPT</h3>
          <p className="text-slate-600">Convert your project into a professional presentation.</p>
        </div>
      ),
    },
    {
      target: '#wallet-balance',
      content: (
        <div className="text-left">
          <h3 className="text-lg font-bold text-emerald-700 mb-2">Your Wallet</h3>
          <p className="text-slate-600">Check your balance here. You get 1 FREE project generation! After that, you can top up to continue using premium features.</p>
        </div>
      ),
    },
    {
      target: window.innerWidth > 768 ? '#dashboard-nav-desktop' : '#dashboard-nav',
      content: (
        <div className="text-left">
          <h3 className="text-lg font-bold text-emerald-700 mb-2">Project Dashboard</h3>
          <p className="text-slate-600">View all your generated projects here. You can edit them, export to PDF, or even generate PowerPoint slides!</p>
        </div>
      ),
    },
    {
      target: window.innerWidth > 768 ? '#support-nav-desktop' : '#support-nav',
      content: (
        <div className="text-left">
          <h3 className="text-lg font-bold text-emerald-700 mb-2">Need Help?</h3>
          <p className="text-slate-600">Our support team is always here to help you with any issues or questions you might have.</p>
        </div>
      ),
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(`tour_seen_${user?.id}`, 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#059669', // emerald-600
          textColor: '#1e293b', // slate-800
          zIndex: 1000,
        },
        tooltipContainer: {
          textAlign: 'left',
          borderRadius: '16px',
          padding: '10px',
        },
        buttonNext: {
          borderRadius: '8px',
          fontWeight: 'bold',
        },
        buttonBack: {
          marginRight: '10px',
          fontWeight: 'bold',
        },
        buttonSkip: {
          color: '#64748b',
        }
      }}
    />
  );
}
