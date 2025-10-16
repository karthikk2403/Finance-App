import requests
import sys
import json
from datetime import datetime

class ExpenseTrackerAPITester:
    def __init__(self, base_url="https://expense-wizard-126.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            return True, test_user
        return False, test_user

    def test_user_login(self, user_credentials):
        """Test user login"""
        login_data = {
            "email": user_credentials["email"],
            "password": user_credentials["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            return True
        return False

    def test_create_sheet(self):
        """Test creating expense sheet"""
        sheet_data = {
            "name": "Test Sheet January",
            "month": "2024-01"
        }
        
        success, response = self.run_test(
            "Create Expense Sheet",
            "POST",
            "sheets",
            200,
            data=sheet_data
        )
        
        if success and 'id' in response:
            return True, response['id']
        return False, None

    def test_get_sheets(self):
        """Test getting all sheets"""
        success, response = self.run_test(
            "Get All Sheets",
            "GET",
            "sheets",
            200
        )
        
        if success and isinstance(response, list):
            return True, response
        return False, []

    def test_get_sheet(self, sheet_id):
        """Test getting specific sheet"""
        success, response = self.run_test(
            "Get Specific Sheet",
            "GET",
            f"sheets/{sheet_id}",
            200
        )
        
        return success, response

    def test_add_expense(self, sheet_id):
        """Test adding expense to sheet"""
        expense_data = {
            "date": "2024-01-15",
            "category": "Food",
            "description": "Grocery shopping",
            "amount": 85.50
        }
        
        success, response = self.run_test(
            "Add Expense",
            "POST",
            f"sheets/{sheet_id}/expenses",
            200,
            data=expense_data
        )
        
        if success and 'expenses' in response and len(response['expenses']) > 0:
            return True, response['expenses'][0]['id']
        return False, None

    def test_update_expense(self, sheet_id, expense_id):
        """Test updating expense"""
        updated_expense = {
            "date": "2024-01-16",
            "category": "Food",
            "description": "Updated grocery shopping",
            "amount": 95.75
        }
        
        success, response = self.run_test(
            "Update Expense",
            "PUT",
            f"sheets/{sheet_id}/expenses/{expense_id}",
            200,
            data=updated_expense
        )
        
        return success, response

    def test_get_stats(self, sheet_id):
        """Test getting sheet statistics"""
        success, response = self.run_test(
            "Get Sheet Statistics",
            "GET",
            f"sheets/{sheet_id}/stats",
            200
        )
        
        if success and 'total' in response and 'by_category' in response:
            return True
        return False

    def test_delete_expense(self, sheet_id, expense_id):
        """Test deleting expense"""
        success, response = self.run_test(
            "Delete Expense",
            "DELETE",
            f"sheets/{sheet_id}/expenses/{expense_id}",
            200
        )
        
        return success

    def test_compare_sheets(self, sheet1_id, sheet2_id):
        """Test comparing two sheets"""
        success, response = self.run_test(
            "Compare Sheets",
            "GET",
            f"sheets/compare/{sheet1_id}/{sheet2_id}",
            200
        )
        
        if success and 'comparison' in response:
            return True
        return False

    def test_generate_pdf(self, sheet_id):
        """Test PDF generation"""
        url = f"{self.api_url}/sheets/{sheet_id}/pdf"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.get(url, headers=headers)
            success = response.status_code == 200 and response.headers.get('content-type') == 'application/pdf'
            
            self.log_test("Generate PDF", success, f"Status: {response.status_code}, Content-Type: {response.headers.get('content-type')}")
            return success
        except Exception as e:
            self.log_test("Generate PDF", False, f"Exception: {str(e)}")
            return False

    def test_delete_sheet(self, sheet_id):
        """Test deleting sheet"""
        success, response = self.run_test(
            "Delete Sheet",
            "DELETE",
            f"sheets/{sheet_id}",
            200
        )
        
        return success

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("🚀 Starting Expense Tracker API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)

        # Test authentication
        reg_success, user_creds = self.test_user_registration()
        if not reg_success:
            print("❌ Registration failed, stopping tests")
            return self.get_results()

        login_success = self.test_user_login(user_creds)
        if not login_success:
            print("❌ Login failed, stopping tests")
            return self.get_results()

        # Test sheet operations
        sheet_success, sheet_id = self.test_create_sheet()
        if not sheet_success:
            print("❌ Sheet creation failed, stopping tests")
            return self.get_results()

        # Create second sheet for comparison
        sheet2_data = {
            "name": "Test Sheet February",
            "month": "2024-02"
        }
        success, response = self.run_test(
            "Create Second Sheet",
            "POST",
            "sheets",
            200,
            data=sheet2_data
        )
        sheet2_id = response.get('id') if success else None

        # Test getting sheets
        self.test_get_sheets()
        self.test_get_sheet(sheet_id)

        # Test expense operations
        expense_success, expense_id = self.test_add_expense(sheet_id)
        if expense_success:
            self.test_update_expense(sheet_id, expense_id)
            self.test_get_stats(sheet_id)
            
            # Add expense to second sheet for comparison
            if sheet2_id:
                self.test_add_expense(sheet2_id)
                self.test_compare_sheets(sheet_id, sheet2_id)
            
            self.test_generate_pdf(sheet_id)
            self.test_delete_expense(sheet_id, expense_id)

        # Cleanup
        self.test_delete_sheet(sheet_id)
        if sheet2_id:
            self.test_delete_sheet(sheet2_id)

        return self.get_results()

    def get_results(self):
        """Get test results summary"""
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
        else:
            print("⚠️  Some tests failed. Check details above.")
            
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
            "detailed_results": self.test_results
        }

def main():
    tester = ExpenseTrackerAPITester()
    results = tester.run_comprehensive_test()
    
    # Return appropriate exit code
    return 0 if results["passed_tests"] == results["total_tests"] else 1

if __name__ == "__main__":
    sys.exit(main())