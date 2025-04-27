import React from 'react';

// icons
import { FaFileExcel, FaEnvelope } from 'react-icons/fa';

const Operations = () => {
  return (
    <div style={styles.container}>
      <button style={styles.topButton}>
        Take me to the Detailed Reports <span style={styles.arrow}>&#x2192;</span>
      </button>
      <p style={styles.chooseText}>Choose a way to send the orders reports.</p>
      <button style={styles.downloadButton}>
        <FaFileExcel size={20} style={styles.icon} />
        Download Excel Sheet
      </button>
      <button style={styles.mailButton}>
        <FaEnvelope size={20} style={styles.icon} />
        Mail the reports
      </button>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    width: '300px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
  topButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: '#e0e0e0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  arrow: {
    fontSize: '18px',
  },
  chooseText: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '20px',
  },
  downloadButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#107c10', // Excel green color
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '10px',
  },
  mailButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  icon: {
    marginRight: '8px',
  },
};

export default ReportOptions;
