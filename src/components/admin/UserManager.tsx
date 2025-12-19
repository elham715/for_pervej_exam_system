import { useState, useEffect } from 'react';
import { userApi } from '../../lib/api';
import { 
  Users, 
  Search, 
  Filter, 
  Edit2, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  UserCheck,
  UserX,
  Shield,
  GraduationCap,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  CheckSquare,
  Square
} from 'lucide-react';

interface User {
  id: string;
  firebase_uid?: string;
  name: string;
  email: string;
  phone?: string;
  college_name?: string;
  address?: string;
  is_enrolled: boolean;
  role: 'ADMIN' | 'STUDENT';
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'STUDENT'>('ALL');
  const [enrollmentFilter, setEnrollmentFilter] = useState<'ALL' | 'ENROLLED' | 'NOT_ENROLLED'>('ALL');

  // Edit mode
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  // Batch selection
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Separate state for page control to avoid infinite loop
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(20);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
        limit: currentLimit,
      };

      if (searchQuery) params.search = searchQuery;
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (enrollmentFilter === 'ENROLLED') params.isEnrolled = true;
      if (enrollmentFilter === 'NOT_ENROLLED') params.isEnrolled = false;

      const response = await userApi.getAllUsers(params);
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, currentLimit]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
  };

  // Handle edit
  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditForm({
      name: user.name,
      phone: user.phone,
      college_name: user.college_name,
      address: user.address,
      is_enrolled: user.is_enrolled,
      role: user.role,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUserId) return;

    try {
      await userApi.updateUser(editingUserId, editForm);
      setEditingUserId(null);
      setEditForm({});
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
      console.error('Error updating user:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditForm({});
  };

  // Handle enrollment toggle
  const handleToggleEnrollment = async (userId: string, currentStatus: boolean) => {
    try {
      await userApi.updateEnrollment(userId, { is_enrolled: !currentStatus });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update enrollment');
      console.error('Error updating enrollment:', err);
    }
  };

  // Batch operations
  const toggleSelectUser = (userId: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map(u => u.id)));
    }
  };

  const handleBatchEnrollment = async (isEnrolled: boolean) => {
    if (selectedUserIds.size === 0) {
      setError('Please select at least one user');
      return;
    }

    try {
      await userApi.batchUpdateEnrollment({
        user_ids: Array.from(selectedUserIds),
        is_enrolled: isEnrolled,
      });
      setSelectedUserIds(new Set());
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to batch update enrollment');
      console.error('Error batch updating enrollment:', err);
    }
  };

  // Pagination
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          </div>
          <div className="text-sm text-gray-600">
            Total: {pagination?.total || 0} users
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="STUDENT">Student</option>
            </select>
          </div>

          {/* Enrollment Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={enrollmentFilter}
              onChange={(e) => setEnrollmentFilter(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="ALL">All Status</option>
              <option value="ENROLLED">Enrolled</option>
              <option value="NOT_ENROLLED">Not Enrolled</option>
            </select>
          </div>
        </div>

        {/* Apply Filters Button */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('ALL');
              setEnrollmentFilter('ALL');
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>

        {/* Batch Actions */}
        {selectedUserIds.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedUserIds.size} user(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBatchEnrollment(true)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <UserCheck className="w-4 h-4 inline mr-1" />
                Enroll
              </button>
              <button
                onClick={() => handleBatchEnrollment(false)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                <UserX className="w-4 h-4 inline mr-1" />
                Unenroll
              </button>
              <button
                onClick={() => setSelectedUserIds(new Set())}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <>
          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <button onClick={toggleSelectAll} className="hover:bg-gray-200 rounded p-1">
                        {selectedUserIds.size === users.length ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Institution</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelectUser(user.id)}
                          className="hover:bg-gray-200 rounded p-1"
                        >
                          {selectedUserIds.has(user.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </td>

                      {/* Name Column */}
                      <td className="px-4 py-3">
                        {editingUserId === user.id ? (
                          <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{user.name}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Contact Column */}
                      <td className="px-4 py-3">
                        {editingUserId === user.id ? (
                          <input
                            type="text"
                            value={editForm.phone || ''}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            placeholder="Phone"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          <div className="text-sm text-gray-600">
                            {user.phone ? (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </div>
                            ) : (
                              <span className="text-gray-400">No phone</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Institution Column */}
                      <td className="px-4 py-3">
                        {editingUserId === user.id ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editForm.college_name || ''}
                              onChange={(e) => setEditForm({ ...editForm, college_name: e.target.value })}
                              placeholder="College"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={editForm.address || ''}
                              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                              placeholder="Address"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            {user.college_name && (
                              <div className="flex items-center gap-1 mb-1">
                                <Building className="w-3 h-3" />
                                {user.college_name}
                              </div>
                            )}
                            {user.address && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="w-3 h-3" />
                                {user.address}
                              </div>
                            )}
                            {!user.college_name && !user.address && (
                              <span className="text-gray-400">No info</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Role Column */}
                      <td className="px-4 py-3">
                        {editingUserId === user.id ? (
                          <select
                            value={editForm.role || 'STUDENT'}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'ADMIN' | 'STUDENT' })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="STUDENT">Student</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                            {user.role}
                          </span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-3">
                        {editingUserId === user.id ? (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editForm.is_enrolled || false}
                              onChange={(e) => setEditForm({ ...editForm, is_enrolled: e.target.checked })}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm">Enrolled</span>
                          </label>
                        ) : (
                          <button
                            onClick={() => handleToggleEnrollment(user.id, user.is_enrolled)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                              user.is_enrolled
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {user.is_enrolled ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                            {user.is_enrolled ? 'Enrolled' : 'Not Enrolled'}
                          </button>
                        )}
                      </td>

                      {/* Joined Column */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {editingUserId === user.id ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination?.page || 1) - 1) * (pagination?.limit || 20) + 1} to{' '}
              {Math.min((pagination?.page || 1) * (pagination?.limit || 20), pagination?.total || 0)} of {pagination?.total || 0} users
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage((pagination?.page || 1) - 1)}
                disabled={(pagination?.page || 1) === 1}
                className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination?.totalPages || 0) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 border rounded text-sm ${
                        (pagination?.page || 1) === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => goToPage((pagination?.page || 1) + 1)}
                disabled={(pagination?.page || 1) === (pagination?.totalPages || 1)}
                className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <select
              value={pagination?.limit || 20}
              onChange={(e) => {
                setCurrentLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
}
