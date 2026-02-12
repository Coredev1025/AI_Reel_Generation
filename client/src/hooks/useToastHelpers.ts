import { useToast } from '../contexts/ToastContext';

export const useToastHelpers = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const showApiError = (error: any, defaultMessage: string = 'An error occurred') => {
    if (error?.response?.data?.error) {
      showError(error.response.data.error);
    } else if (error?.message) {
      showError(error.message);
    } else {
      showError(defaultMessage);
    }
  };

  const showApiSuccess = (message: string) => {
    showSuccess(message);
  };

  const showProcessingStart = () => {
    showInfo('Processing started. This may take a few minutes...');
  };

  const showProcessingComplete = () => {
    showSuccess('Processing completed successfully!');
  };

  const showUploadSuccess = (count: number, type: 'photos' | 'music' = 'photos') => {
    showSuccess(`${count} ${type} uploaded successfully!`);
  };

  const showDeleteSuccess = (type: string) => {
    showSuccess(`${type} deleted successfully`);
  };

  return {
    showApiError,
    showApiSuccess,
    showProcessingStart,
    showProcessingComplete,
    showUploadSuccess,
    showDeleteSuccess,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}; 