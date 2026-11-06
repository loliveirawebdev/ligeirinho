import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ACCESS_TOKEN_STORAGE_KEY, accessTokenInterceptor } from './access-token.interceptor';

function setUp() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(withInterceptors([accessTokenInterceptor])), provideHttpClientTesting()],
  });
  return { httpClient: TestBed.inject(HttpClient), httpTesting: TestBed.inject(HttpTestingController) };
}

describe('access token interceptor', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('sends the stored token as a bearer token', () => {
    sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'token-123');
    const { httpClient, httpTesting } = setUp();
    httpClient.get('/api/tasks').subscribe();
    expect(httpTesting.expectOne('/api/tasks').request.headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('sends no Authorization header without a token', () => {
    const { httpClient, httpTesting } = setUp();
    httpClient.get('/api/tasks').subscribe();
    expect(httpTesting.expectOne('/api/tasks').request.headers.has('Authorization')).toBe(false);
  });
});
