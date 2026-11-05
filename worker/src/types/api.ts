/** Shape of every JSON response returned by the API. */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}
