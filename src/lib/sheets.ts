

'use server';

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import type { Project, User, UserRole, Client, Task, TaskStatus, Activity, ProjectType } from './types';

const SPREADSHEET_ID = '1lVy51rKvYbw0IN3erlBcZ99PT1RjQVKeZjwS_87EwOU';
const USER_SHEET_NAME = 'user';
const PROJECT_SHEET_NAME = 'project';
const CLIENT_SHEET_NAME = 'client';
const LIST_SHEET_NAME = 'list';
const TASK_SHEET_NAME = 'task';
const ACTIVITY_SHEET_NAME = 'activity';


const getAuth = () => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY must be set in .env');
  }

  return new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
};

const getSheets = () => {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
};

async function ensureSheetHeaders(sheetName: string, headers: string[]) {
  const sheets = getSheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
    });

    const values = response.data.values;
    if (!values || values.length === 0 || values[0].length < headers.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });
    }
  } catch (error: any) {
    if (error.code === 400 && error.errors?.[0]?.message.includes('Unable to parse range')) {
       await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
    } else {
      console.error(`Error ensuring sheet headers for ${sheetName}:`, error);
      throw new Error(`Could not prepare the ${sheetName} data sheet.`);
    }
  }
}

export async function getProjectTypes(): Promise<ProjectType[]> {
  if (!SPREADSHEET_ID || !LIST_SHEET_NAME) {
    throw new Error('Server configuration error for project types sheet.');
  }
  try {
    const sheets = getSheets();
    await ensureSheetHeaders(LIST_SHEET_NAME, ['id', 'name']);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${LIST_SHEET_NAME}!A:B`,
    });
    
    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }

    const projectTypes: ProjectType[] = [];
    for (const row of rows.slice(1)) {
        try {
            if (!Array.isArray(row) || !row[0] || !row[1]) {
                console.warn(`Skipping incomplete or malformed project type data row:`, row);
                continue;
            }
            projectTypes.push({
                id: row[0],
                name: row[1],
            });
        } catch (e) {
            console.warn(`Could not process project type row. Error: ${e}. Row data:`, row);
            continue;
        }
    }
    return projectTypes;
  } catch (error) {
    console.error('Error getting project types from sheet:', error);
    throw new Error('Could not retrieve project type data.');
  }
}

export async function getClients(): Promise<Client[]> {
  if (!SPREADSHEET_ID || !CLIENT_SHEET_NAME) {
    throw new Error('Server configuration error for clients sheet.');
  }
  try {
    const sheets = getSheets();
    await ensureSheetHeaders(CLIENT_SHEET_NAME, ['id', 'name', 'address']);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${CLIENT_SHEET_NAME}!A:C`,
    });
    
    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }

    const clients: Client[] = [];
    for (const row of rows.slice(1)) {
        try {
            if (!Array.isArray(row) || !row[0] || !row[1]) {
                console.warn(`Skipping incomplete or malformed client data row:`, row);
                continue;
            }
            clients.push({
                id: row[0],
                name: row[1],
                address: row[2] || '',
            });
        } catch (e) {
            console.warn(`Could not process client row. Error: ${e}. Row data:`, row);
            continue;
        }
    }
    return clients;
  } catch (error) {
    console.error('Error getting clients from sheet:', error);
    throw new Error('Could not retrieve client data.');
  }
}

export async function createClient(client: Omit<Client, 'id'>): Promise<Client> {
    if (!SPREADSHEET_ID || !CLIENT_SHEET_NAME) {
        throw new Error('Server configuration error for clients sheet.');
    }
    try {
        const sheets = getSheets();
        await ensureSheetHeaders(CLIENT_SHEET_NAME, ['id', 'name', 'address']);
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${CLIENT_SHEET_NAME}!A:A`,
        });

        const idRows = response.data.values || [];
        let lastIdNumber = 0;
        if (idRows.length > 1) {
            const lastId = idRows[idRows.length - 1][0];
            if (lastId && lastId.startsWith('CLIENT-')) {
                lastIdNumber = parseInt(lastId.split('-')[1], 10);
            }
        }

        const newIdNumber = lastIdNumber + 1;
        const clientId = `CLIENT-${String(newIdNumber).padStart(3, '0')}`;
        const newClientRow = [clientId, client.name, client.address || ''];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${CLIENT_SHEET_NAME}!A:C`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [newClientRow],
            },
        });

        return {
            id: clientId,
            name: client.name,
            address: client.address || '',
        };
    } catch (error) {
        console.error('Error creating client in sheet:', error);
        throw new Error('Could not create client.');
    }
}

export async function getOrCreateClientByName(name: string): Promise<Client> {
  const clients = await getClients();
  const existingClient = clients.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (existingClient) {
    return existingClient;
  }
  return createClient({ name, address: '' });
}

export async function updateClient(client: Client): Promise<Client> {
    if (!SPREADSHEET_ID || !CLIENT_SHEET_NAME) {
        throw new Error('Server configuration error for clients sheet.');
    }
    try {
        const sheets = getSheets();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${CLIENT_SHEET_NAME}!A:A`,
        });

        const rows = response.data.values;
        if (!rows) {
            throw new Error('No clients found in the sheet.');
        }

        const rowIndex = rows.findIndex(row => row[0] === client.id);
        if (rowIndex === -1) {
            throw new Error(`Client with ID ${client.id} not found.`);
        }

        const updatedRow = [client.id, client.name, client.address];

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${CLIENT_SHEET_NAME}!A${rowIndex + 1}:C${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [updatedRow],
            },
        });

        return client;
    } catch (error) {
        console.error('Error updating client in sheet:', error);
        throw new Error('Could not update client.');
    }
}

export async function getUsers(): Promise<User[]> {
  if (!SPREADSHEET_ID || !USER_SHEET_NAME) {
    throw new Error('Server configuration error for users sheet.');
  }
  try {
    const sheets = getSheets();
    await ensureSheetHeaders(USER_SHEET_NAME, ['id', 'username', 'name', 'email', 'password', 'role', 'team', 'status']);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_SHEET_NAME}!A:H`,
    });
    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }
    
    const users: User[] = [];
    for (const row of rows.slice(1)) {
        try {
            if (!Array.isArray(row) || !row[0] || !row[1] || !row[2] || !row[3]) {
                console.warn('Skipping incomplete or malformed user row:', row);
                continue;
            }
            users.push({
                id: row[0],
                username: row[1],
                name: row[2],
                email: row[3],
                password: row[4],
                avatar: `https://placehold.co/100x100.png?text=${row[2].charAt(0)}`,
                role: row[5] as UserRole,
                team: row[6],
                status: row[7] || 'Active',
            });
        } catch(e) {
            console.warn(`Could not process user row. Error: ${e}. Row data:`, row);
        }
    }
    return users;

  } catch (error) {
    console.error('Error getting users from sheet:', error);
    throw new Error('Could not retrieve user data.');
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  if (!SPREADSHEET_ID || !USER_SHEET_NAME) {
    console.error("Missing Google Sheets configuration");
    throw new Error('Server configuration error.');
  }
  try {
    const sheets = getSheets();
    await ensureSheetHeaders(USER_SHEET_NAME, ['id', 'username', 'name', 'email', 'password', 'role', 'team', 'status']);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_SHEET_NAME}!A:H`,
    });

    const rows = response.data.values;
    if (rows) {
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[3] === email) { // email is in column D (index 3)
          return {
            id: row[0],
            username: row[1],
            name: row[2],
            email: row[3],
            avatar: `https://placehold.co/100x100.png?text=${row[2].charAt(0)}`,
            role: row[5],
            team: row[6],
            status: row[7] || 'Active',
          };
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error finding user in sheet:', error);
    throw new Error('Could not access user data.');
  }
}

export async function createUser(user: Omit<User, 'id' | 'avatar'>): Promise<User> {
   if (!SPREADSHEET_ID || !USER_SHEET_NAME) {
    console.error("Missing Google Sheets configuration");
    throw new Error('Server configuration error.');
  }
  try {
    const sheets = getSheets();
    await ensureSheetHeaders(USER_SHEET_NAME, ['id', 'username', 'name', 'email', 'password', 'role', 'team', 'status']);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_SHEET_NAME}!A:A`,
    });

    const idRows = response.data.values || [];
    let lastIdNumber = 0;
    if (idRows.length > 1) {
      const lastId = idRows[idRows.length - 1][0];
      if (lastId && lastId.startsWith('USER-')) {
        lastIdNumber = parseInt(lastId.split('-')[1], 10);
      }
    }

    const newIdNumber = lastIdNumber + 1;
    const userId = `USER-${String(newIdNumber).padStart(3, '0')}`;
    const newUserRow = [userId, user.username, user.name, user.email, user.password, user.role, user.team, user.status || 'Active'];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_SHEET_NAME}!A:H`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newUserRow],
      },
    });
    
    return {
      id: userId,
      ...user,
      avatar: `https://placehold.co/100x100.png?text=${user.name.charAt(0)}`,
    };
  } catch (error) {
    console.error('Error creating user in sheet:', error);
    throw new Error('Could not create user.');
  }
}

export async function updateUser(user: Omit<User, 'avatar'>): Promise<User> {
  if (!SPREADSHEET_ID || !USER_SHEET_NAME) {
    console.error("Missing Google Sheets configuration");
    throw new Error('Server configuration error.');
  }
  try {
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_SHEET_NAME}!A:A`,
    });

    const rows = response.data.values;
    if (rows) {
      const rowIndex = rows.findIndex(row => row[0] === user.id);
      if (rowIndex > 0) {
        
        const originalRowResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${USER_SHEET_NAME}!A${rowIndex + 1}:H${rowIndex + 1}`,
        });
        const originalRow = originalRowResponse.data.values?.[0];
        
        const updatedRow = [
          user.id,
          user.username,
          user.name,
          user.email,
          user.password || originalRow?.[4],
          user.role,
          user.team,
          user.status || originalRow?.[7] || 'Active'
        ];

        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${USER_SHEET_NAME}!A${rowIndex + 1}:H${rowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [updatedRow],
          },
        });
        
         return {
          ...user,
          avatar: `https://placehold.co/100x100.png?text=${user.name.charAt(0)}`,
        };

      } else {
        throw new Error(`User with ID ${user.id} not found.`);
      }
    } else {
       throw new Error(`No users found in sheet.`);
    }
  } catch (error) {
    console.error('Error updating user in sheet:', error);
    throw new Error('Could not update user.');
  }
}


export async function verifyUser(username: string, password: string):Promise<User | null> {
   if (!SPREADSHEET_ID || !USER_SHEET_NAME) {
    console.error("Missing Google Sheets configuration");
    throw new Error('Server configuration error.');
  }
  try {
    const sheets = getSheets();
    await ensureSheetHeaders(USER_SHEET_NAME, ['id', 'username', 'name', 'email', 'password', 'role', 'team', 'status']);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${USER_SHEET_NAME}!A:H`,
    });

    const rows = response.data.values;
    if (rows) {
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const userStatus = row[7] || 'Active'; // Default to Active if status is not set
        if (row[1] === username && row[4] === password) {
          if (userStatus === 'Inactive') {
            return null; // Do not allow login for inactive users
          }
          return {
            id: row[0],
            username: row[1],
            name: row[2],
            email: row[3],
            avatar: `https://placehold.co/100x100.png?text=${row[2].charAt(0)}`,
            role: row[5],
            team: row[6],
            status: userStatus,
          };
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error verifying user in sheet:', error);
    throw new Error('Could not access user data.');
  }
}


export async function getProjects(): Promise<Project[]> {
  if (!SPREADSHEET_ID || !PROJECT_SHEET_NAME) {
    console.error("Missing Google Sheets configuration");
    throw new Error('Server configuration error.');
  }
  try {
    const sheets = getSheets();
    const projectHeaders = ['id', 'name', 'description', 'clientID', 'teamLeaderId', 'teamMemberIds', 'startDate', 'deadline', 'status', 'priority', 'type', 'shareToken'];
    await ensureSheetHeaders(PROJECT_SHEET_NAME, projectHeaders);
    
    const [users, clients, projectResponse] = await Promise.all([
      getUsers(),
      getClients(),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${PROJECT_SHEET_NAME}!A:L`,
      })
    ]);
    
    const userMap = new Map<string, User>(users.map(user => [user.id, user]));
    const clientMap = new Map<string, string>(clients.map(client => [client.id, client.name]));

    const projectRows = projectResponse.data.values;
    
    if (!projectRows || projectRows.length <= 1) {
      return [];
    }

    const projects: Project[] = [];
    for (const row of projectRows.slice(1)) {
        try {
            if (!Array.isArray(row) || !row[0]) continue;

            const projectId = row[0];
            const projectName = row[1];
            const clientId = row[3];
            const teamLeaderId = row[4];
            
            if (!projectName || !row[6] || !row[7] || !teamLeaderId || !clientId) {
                console.warn(`Skipping incomplete project data for project ID ${projectId || 'N/A'}:`, row);
                continue;
            }
            
            const teamMemberIds = row[5] ? row[5].split(',').map((s: string) => s.trim()) : [];
            const teamLeaderUser = userMap.get(teamLeaderId);
            const clientName = clientMap.get(clientId);

            if (!teamLeaderUser) {
              console.warn(`Team leader with ID '${teamLeaderId}' not found for project '${projectName}'. Skipping project.`);
              continue;
            }
            
            if (!clientName) {
              console.warn(`Client with ID '${clientId}' not found for project '${projectName}'. Skipping project.`);
              continue;
            }

            const teamMembersUsers = teamMemberIds.map((id: string) => userMap.get(id)).filter(Boolean) as User[];

            projects.push({
                id: projectId,
                name: projectName,
                description: row[2] || '',
                clientId: clientId,
                clientName: clientName,
                teamLeaderId: teamLeaderId,
                teamLeader: teamLeaderUser.name,
                teamMemberIds: teamMemberIds,
                teamMembers: teamMembersUsers,
                startDate: row[6],
                deadline: row[7],
                status: row[8],
                priority: row[9],
                type: row[10] || '',
                shareToken: row[11] || '',
            });
        } catch (e) {
            console.warn(`Could not process project row. Error: ${e}. Row data:`, row);
            continue;
        }
    }
    return projects;

  } catch (error) {
    console.error('Error getting projects from sheet:', error);
    throw new Error('Could not retrieve project data.');
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  if (!SPREADSHEET_ID || !PROJECT_SHEET_NAME) {
    console.error("Missing Google Sheets configuration");
    throw new Error('Server configuration error.');
  }
  try {
    const sheets = getSheets();
    const [projectResponse, users, clients] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${PROJECT_SHEET_NAME}!A:L`,
      }),
      getUsers(),
      getClients()
    ]);

    const projectRows = projectResponse.data.values;
    if (!projectRows || projectRows.length <= 1) {
      return null;
    }

    const projectRow = projectRows.find(row => row[0] === id);
    if (!projectRow) {
      return null;
    }
    
    const userMap = new Map(users.map(u => [u.id, u]));
    const clientMap = new Map(clients.map(c => [c.id, c.name]));

    const teamLeaderId = projectRow[4];
    const teamMemberIds = projectRow[5] ? projectRow[5].split(',').map((s: string) => s.trim()) : [];
    const clientId = projectRow[3];
    const teamLeaderUser = userMap.get(teamLeaderId);
    const teamMembersUsers = teamMemberIds.map((id: string) => userMap.get(id)).filter(Boolean) as User[];

    return {
      id: projectRow[0],
      name: projectRow[1],
      description: projectRow[2],
      clientId: clientId,
      clientName: clientMap.get(clientId) || 'Unknown Client',
      teamLeaderId: teamLeaderId,
      teamLeader: teamLeaderUser?.name || 'Unknown User',
      teamMemberIds: teamMemberIds,
      teamMembers: teamMembersUsers,
      startDate: projectRow[6],
      deadline: projectRow[7],
      status: projectRow[8] as Project['status'],
      priority: projectRow[9] as Project['priority'],
      type: projectRow[10] || '',
      shareToken: projectRow[11] || '',
    };
  } catch (error) {
    console.error(`Error getting project by ID ${id} from sheet:`, error);
    throw new Error('Could not retrieve project data.');
  }
}


export async function createProject(project: Omit<Project, 'id' | 'teamLeader' | 'teamMembers' | 'teamMemberIds' | 'clientName'> & { teamLeaderId: string; teamMemberIds: string[], clientId: string }): Promise<Project> {
  if (!SPREADSHEET_ID || !PROJECT_SHEET_NAME) {
    console.error("Missing Google Sheets configuration");
    throw new Error('Server configuration error.');
  }
  try {
    const sheets = getSheets();
    const projectHeaders = ['id', 'name', 'description', 'clientID', 'teamLeaderId', 'teamMemberIds', 'startDate', 'deadline', 'status', 'priority', 'type', 'shareToken'];
    await ensureSheetHeaders(PROJECT_SHEET_NAME, projectHeaders);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${PROJECT_SHEET_NAME}!A:A`,
    });
    
    const idRows = response.data.values || [];
    let lastIdNumber = 0;
    if (idRows.length > 1) {
      const lastId = idRows[idRows.length - 1][0];
      if (lastId && lastId.startsWith('PROJ-')) {
        lastIdNumber = parseInt(lastId.split('-')[1], 10);
      }
    }
    
    const newIdNumber = lastIdNumber + 1;
    const projectId = `PROJ-${String(newIdNumber).padStart(3, '0')}`;
    const newProjectRow = [
      projectId,
      project.name,
      project.description,
      project.clientId,
      project.teamLeaderId,
      project.teamMemberIds.join(','),
      project.startDate,
      project.deadline,
      project.status,
      project.priority,
      project.type || '',
      project.shareToken || '',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${PROJECT_SHEET_NAME}!A:L`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newProjectRow],
      },
    });

    const [users, clients] = await Promise.all([getUsers(), getClients()]);
    const userMap = new Map(users.map(u => [u.id, u]));
    const clientMap = new Map(clients.map(c => [c.id, c.name]));
    
    const teamLeaderUser = userMap.get(project.teamLeaderId);
    const teamMembersUsers = project.teamMemberIds.map(id => userMap.get(id)).filter(Boolean) as User[];

    return { 
      ...project, 
      id: projectId,
      clientName: clientMap.get(project.clientId) || 'Unknown Client',
      teamLeader: teamLeaderUser?.name || 'Unknown User',
      teamMembers: teamMembersUsers,
    };
  } catch (error) {
    console.error('Error creating project in sheet:', error);
    throw new Error('Could not create project.');
  }
}

export async function updateProject(project: Omit<Project, 'teamLeader' | 'teamMembers' | 'clientName'>): Promise<Project> {
  if (!SPREADSHEET_ID || !PROJECT_SHEET_NAME) {
    console.error("Missing Google Sheets configuration");
    throw new Error('Server configuration error.');
  }
  try {
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${PROJECT_SHEET_NAME}!A:A`,
    });

    const rows = response.data.values;
    if (!rows) {
      throw new Error('No projects found in the sheet.');
    }
    const rowIndex = rows.findIndex(row => row[0] === project.id);
    if (rowIndex === -1) {
      throw new Error(`Project with ID ${project.id} not found.`);
    }

    const updatedRow = [
      project.id,
      project.name,
      project.description,
      project.clientId,
      project.teamLeaderId,
      project.teamMemberIds.join(','),
      project.startDate,
      project.deadline,
      project.status,
      project.priority,
      project.type || '',
      project.shareToken || '',
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${PROJECT_SHEET_NAME}!A${rowIndex + 1}:L${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });
    
    const [users, clients] = await Promise.all([getUsers(), getClients()]);
    const userMap = new Map(users.map(u => [u.id, u]));
    const clientMap = new Map(clients.map(c => [c.id, c.name]));
    
    const teamLeaderUser = userMap.get(project.teamLeaderId);
    const teamMembersUsers = project.teamMemberIds.map(id => userMap.get(id)).filter(Boolean) as User[];

    return {
      ...project,
      clientName: clientMap.get(project.clientId) || 'Unknown Client',
      teamLeader: teamLeaderUser?.name || 'Unknown User',
      teamMembers: teamMembersUsers,
    };

  } catch (error) {
    console.error('Error updating project in sheet:', error);
    throw new Error('Could not update project.');
  }
}


export async function updateProjectStatus(id: string, status: Project['status']): Promise<void> {
  if (!SPREADSHEET_ID || !PROJECT_SHEET_NAME) {
    console.error("Missing Google Sheets configuration");
    throw new Error('Server configuration error.');
  }
  try {
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${PROJECT_SHEET_NAME}!A:A`,
    });

    const rows = response.data.values;
    if (rows) {
      const rowIndex = rows.findIndex(row => row[0] === id);
      if (rowIndex > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${PROJECT_SHEET_NAME}!I${rowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[status]],
          },
        });
      } else {
        throw new Error(`Project with ID ${id} not found.`);
      }
    }
  } catch (error) {
    console.error('Error updating project status in sheet:', error);
    throw new Error('Could not update project status.');
  }
}

export async function getTasks(): Promise<Task[]> {
  if (!SPREADSHEET_ID || !TASK_SHEET_NAME) {
    throw new Error('Server configuration error for tasks sheet.');
  }
  try {
    const sheets = getSheets();
    await ensureSheetHeaders(TASK_SHEET_NAME, ['id', 'name', 'description', 'projectID', 'userID', 'status']);
    
    const [users, taskResponse] = await Promise.all([
        getUsers(),
        sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${TASK_SHEET_NAME}!A:F`,
        })
    ]);

    const userMap = new Map(users.map(u => [u.id, u]));
    const rows = taskResponse.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }
    
    const tasks: Task[] = [];
    for (const row of rows.slice(1)) {
      try {
        if (!Array.isArray(row) || !row[0] || !row[1]) {
          console.warn(`Skipping incomplete task row:`, row);
          continue;
        };
        
        const user = userMap.get(row[4]);
        if (!user) {
            console.warn(`User with ID ${row[4]} not found for task. Skipping.`);
            continue;
        }

        tasks.push({
          id: row[0],
          name: row[1],
          description: row[2],
          projectId: row[3],
          userId: row[4],
          userName: user.name,
          userAvatar: user.avatar,
          status: row[5] as TaskStatus,
        });
      } catch (e) {
        console.warn(`Could not process task row. Error: ${e}. Row data:`, row);
      }
    }
    return tasks;
  } catch (error) {
    console.error('Error getting tasks from sheet:', error);
    throw new Error('Could not retrieve task data.');
  }
}

export async function createTask(task: Omit<Task, 'id' | 'userName' | 'userAvatar'>): Promise<Task> {
  if (!SPREADSHEET_ID || !TASK_SHEET_NAME) {
    throw new Error('Server configuration error for tasks sheet.');
  }
  try {
    const sheets = getSheets();
    await ensureSheetHeaders(TASK_SHEET_NAME, ['id', 'name', 'description', 'projectID', 'userID', 'status']);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TASK_SHEET_NAME}!A:A`,
    });
    
    const idRows = response.data.values || [];
    let lastIdNumber = 0;
    if (idRows.length > 1) {
        const lastId = idRows[idRows.length - 1][0];
        if (lastId && lastId.startsWith('TASK-')) {
            lastIdNumber = parseInt(lastId.split('-')[1], 10);
        }
    }

    const newIdNumber = lastIdNumber + 1;
    const taskId = `TASK-${String(newIdNumber).padStart(4, '0')}`;
    const newTaskRow = [
      taskId,
      task.name,
      task.description,
      task.projectId,
      task.userId,
      task.status,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TASK_SHEET_NAME}!A:F`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newTaskRow],
      },
    });

    const user = await getUsers().then(users => users.find(u => u.id === task.userId));

    return { 
      ...task, 
      id: taskId,
      userName: user?.name || 'Unknown User',
      userAvatar: user?.avatar || `https://placehold.co/100x100.png?text=U`,
    };
  } catch (error) {
    console.error('Error creating task in sheet:', error);
    throw new Error('Could not create task.');
  }
}

export async function updateTask(task: Task): Promise<Task> {
    if (!SPREADSHEET_ID || !TASK_SHEET_NAME) {
        throw new Error('Server configuration error for tasks sheet.');
    }
    try {
        const sheets = getSheets();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${TASK_SHEET_NAME}!A:A`,
        });

        const rows = response.data.values;
        if (!rows) {
            throw new Error('No tasks found in the sheet.');
        }
        const rowIndex = rows.findIndex(row => row[0] === task.id);
        if (rowIndex === -1) {
            throw new Error(`Task with ID ${task.id} not found.`);
        }

        const updatedRow = [
            task.id,
            task.name,
            task.description,
            task.projectId,
            task.userId,
            task.status,
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${TASK_SHEET_NAME}!A${rowIndex + 1}:F${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [updatedRow],
            },
        });
        
        return task;

    } catch (error) {
        console.error('Error updating task in sheet:', error);
        throw new Error('Could not update task.');
  }
}

export async function getActivities(): Promise<Activity[]> {
  if (!SPREADSHEET_ID || !ACTIVITY_SHEET_NAME) {
    throw new Error('Server configuration error for activities sheet.');
  }
  try {
    const sheets = getSheets();
    const activityHeaders = ['id', 'activity', 'taskID', 'projID', 'userID', 'date', 'starttime', 'endtime'];
    await ensureSheetHeaders(ACTIVITY_SHEET_NAME, activityHeaders);
    
    const [users, tasks] = await Promise.all([
      getUsers(),
      getTasks()
    ]);
    const userMap = new Map(users.map(u => [u.id, u]));
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    
    const activityResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${ACTIVITY_SHEET_NAME}!A:H`,
    });

    const activityRows = activityResponse.data.values;
    
    if (!activityRows || activityRows.length <= 1) {
      return [];
    }
    
    const activities: Activity[] = [];
    for (const row of activityRows.slice(1)) {
        try {
          if (!Array.isArray(row) || !row[0]) continue;

          const user = userMap.get(row[4]);
          const task = taskMap.get(row[2]);

          if (!user) {
            console.warn(`User with ID ${row[4]} not found for activity. Skipping.`);
            continue;
          }
          if (!task) {
            console.warn(`Task with ID ${row[2]} not found for activity. Skipping.`);
            continue;
          }

          activities.push({
            id: row[0],
            activity: row[1],
            taskId: row[2],
            taskName: task.name,
            projectId: row[3],
            userId: row[4],
            userName: user.name,
            userAvatar: user.avatar,
            date: row[5],
            startTime: row[6],
            endTime: row[7],
          });
        } catch(e) {
            console.warn(`Could not process activity row. Error: ${e}. Row data:`, row);
        }
      }
      
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error getting activities from sheet:', error);
    throw new Error('Could not retrieve activity data.');
  }
}

export async function createActivity(activity: Omit<Activity, 'id' | 'userName' | 'userAvatar' | 'taskName'>): Promise<Activity> {
  if (!SPREADSHEET_ID || !ACTIVITY_SHEET_NAME) {
    throw new Error('Server configuration error for activities sheet.');
  }
  try {
    const sheets = getSheets();
    const activityHeaders = ['id', 'activity', 'taskID', 'projID', 'userID', 'date', 'starttime', 'endtime'];
    await ensureSheetHeaders(ACTIVITY_SHEET_NAME, activityHeaders);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${ACTIVITY_SHEET_NAME}!A:A`,
    });
    
    const idRows = response.data.values || [];
    let lastIdNumber = 0;
    if (idRows.length > 1) {
      const lastId = idRows[idRows.length - 1][0];
      if (lastId && lastId.startsWith('ACT-')) {
          lastIdNumber = parseInt(lastId.split('-')[1], 10);
      }
    }
    
    const newIdNumber = lastIdNumber + 1;
    const activityId = `ACT-${String(newIdNumber).padStart(4, '0')}`;
    const newActivityRow = [
      activityId,
      activity.activity,
      activity.taskId,
      activity.projectId,
      activity.userId,
      activity.date,
      activity.startTime,
      activity.endTime,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${ACTIVITY_SHEET_NAME}!A:H`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newActivityRow],
      },
    });

    const [user, task] = await Promise.all([
        getUsers().then(users => users.find(u => u.id === activity.userId)),
        getTasks().then(tasks => tasks.find(t => t.id === activity.taskId)),
    ]);

    return { 
      ...activity, 
      id: activityId,
      userName: user?.name || 'Unknown User',
      userAvatar: user?.avatar || `https://placehold.co/100x100.png?text=U`,
      taskName: task?.name || 'Unknown Task',
    };
  } catch (error) {
    console.error('Error creating activity in sheet:', error);
    throw new Error('Could not create activity.');
  }
}


export async function updateActivity(activity: Activity): Promise<Activity> {
    if (!SPREADSHEET_ID || !ACTIVITY_SHEET_NAME) {
        throw new Error('Server configuration error for activities sheet.');
    }
    try {
        const sheets = getSheets();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${ACTIVITY_SHEET_NAME}!A:A`,
        });

        const rows = response.data.values;
        if (!rows) {
            throw new Error('No activities found in the sheet.');
        }
        const rowIndex = rows.findIndex(row => row[0] === activity.id);
        if (rowIndex === -1) {
            throw new Error(`Activity with ID ${activity.id} not found.`);
        }

        const updatedRow = [
            activity.id,
            activity.activity,
            activity.taskId,
            activity.projectId,
            activity.userId,
            activity.date,
            activity.startTime,
            activity.endTime,
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${ACTIVITY_SHEET_NAME}!A${rowIndex + 1}:H${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [updatedRow],
            },
        });
        
        return activity;

    } catch (error) {
        console.error('Error updating activity in sheet:', error);
        throw new Error('Could not update activity.');
    }
}


async function getSheetId(sheets: any, sheetName: string): Promise<number | null> {
    const response = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
    });
    const sheet = response.data.sheets?.find(s => s.properties?.title === sheetName);
    return sheet?.properties?.sheetId ?? null;
}

async function deleteRowAndAppendBlank(sheetName: string, rowId: string, idColumnIndex: number = 0) {
    if (!SPREADSHEET_ID) {
        throw new Error('Server configuration error.');
    }

    const sheets = getSheets();

    const sheetId = await getSheetId(sheets, sheetName);
    if (sheetId === null) {
        throw new Error(`Sheet "${sheetName}" could not be found.`);
    }

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!${String.fromCharCode(65 + idColumnIndex)}:${String.fromCharCode(65 + idColumnIndex)}`,
    });

    const rows = response.data.values;
    if (!rows) {
        throw new Error(`No data found in sheet "${sheetName}".`);
    }

    const rowIndex = rows.findIndex(row => row[0] === rowId);

    if (rowIndex === -1 || rowIndex === 0) {
        throw new Error(`Item with ID "${rowId}" not found in sheet "${sheetName}".`);
    }

    const requests = [
        {
            deleteDimension: {
                range: {
                    sheetId: sheetId,
                    dimension: 'ROWS',
                    startIndex: rowIndex,
                    endIndex: rowIndex + 1,
                },
            },
        },
        {
            appendDimension: {
                sheetId: sheetId,
                dimension: "ROWS",
                length: 1
            }
        }
    ];
    
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
            requests,
        },
    });
}

export async function deleteProjectAndRelatedData(projectId: string): Promise<void> {
  if (!SPREADSHEET_ID) {
    throw new Error('Server configuration error.');
  }

  const sheets = getSheets();

  try {
    const [taskSheetId, activitySheetId] = await Promise.all([
      getSheetId(sheets, TASK_SHEET_NAME),
      getSheetId(sheets, ACTIVITY_SHEET_NAME),
    ]);

    if (taskSheetId === null || activitySheetId === null) {
      throw new Error('One or more related sheets could not be found.');
    }

    const [taskRows, activityRows] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${TASK_SHEET_NAME}!A:D` }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${ACTIVITY_SHEET_NAME}!A:D` }),
    ]);

    const requests: any[] = [];
    const rowsToDelete: { [key: number]: number } = {};

    if (taskRows.data.values) {
        taskRows.data.values.forEach((row, index) => {
            if (index > 0 && row[3] === projectId) {
                if (!rowsToDelete[taskSheetId]) rowsToDelete[taskSheetId] = 0;
                rowsToDelete[taskSheetId]++;
                requests.push({
                    deleteDimension: {
                        range: { sheetId: taskSheetId, dimension: 'ROWS', startIndex: index, endIndex: index + 1 }
                    }
                });
            }
        });
    }

    if (activityRows.data.values) {
        activityRows.data.values.forEach((row, index) => {
            if (index > 0 && row[3] === projectId) {
                if (!rowsToDelete[activitySheetId]) rowsToDelete[activitySheetId] = 0;
                rowsToDelete[activitySheetId]++;
                requests.push({
                    deleteDimension: {
                        range: { sheetId: activitySheetId, dimension: 'ROWS', startIndex: index, endIndex: index + 1 }
                    }
                });
            }
        });
    }

    requests.sort((a, b) => (b.deleteDimension.range.startIndex ?? 0) - (a.deleteDimension.range.startIndex ?? 0));
    
    await deleteRowAndAppendBlank(PROJECT_SHEET_NAME, projectId);

    for (const sheetId in rowsToDelete) {
        requests.push({
            appendDimension: {
                sheetId: parseInt(sheetId),
                dimension: "ROWS",
                length: rowsToDelete[sheetId]
            }
        });
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests,
        },
      });
    }

  } catch (error) {
    console.error('Error deleting project and related data:', error);
    throw new Error('Could not delete project data.');
  }
}

export async function deleteUser(userId: string): Promise<void> {
    const projects = await getProjects();
    const isUserInProject = projects.some(p => p.teamLeaderId === userId || p.teamMemberIds.some(tm => tm.id === userId));

    if (isUserInProject) {
        throw new Error("Cannot delete user. The user is currently assigned to one or more projects.");
    }
    
    await deleteRowAndAppendBlank(USER_SHEET_NAME, userId);
}


export async function deleteClient(clientId: string): Promise<void> {
    const projects = await getProjects();
    const isClientInProject = projects.some(p => p.clientId === clientId);
    
    if (isClientInProject) {
        throw new Error("Cannot delete client. The client is associated with one or more projects.");
    }
    
    await deleteRowAndAppendBlank(CLIENT_SHEET_NAME, clientId);
}

export async function deleteTaskAndRelatedActivities(taskId: string): Promise<void> {
  if (!SPREADSHEET_ID) {
    throw new Error('Server configuration error.');
  }

  const sheets = getSheets();

  try {
    const activitySheetId = await getSheetId(sheets, ACTIVITY_SHEET_NAME);
    if (activitySheetId === null) {
      throw new Error(`Sheet "${ACTIVITY_SHEET_NAME}" could not be found.`);
    }

    const activityRows = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${ACTIVITY_SHEET_NAME}!A:C`,
    });

    const requests: any[] = [];
    const rowsToDelete: { [key: number]: number } = {};

    if (activityRows.data.values) {
      activityRows.data.values.forEach((row, index) => {
        if (index > 0 && row[2] === taskId) {
          if (!rowsToDelete[activitySheetId]) rowsToDelete[activitySheetId] = 0;
          rowsToDelete[activitySheetId]++;
          requests.push({
            deleteDimension: {
              range: { sheetId: activitySheetId, dimension: 'ROWS', startIndex: index, endIndex: index + 1 },
            },
          });
        }
      });
    }

    requests.sort((a, b) => (b.deleteDimension.range.startIndex ?? 0) - (a.deleteDimension.range.startIndex ?? 0));

    await deleteRowAndAppendBlank(TASK_SHEET_NAME, taskId);

    for (const sheetId in rowsToDelete) {
      requests.push({
        appendDimension: {
          sheetId: parseInt(sheetId),
          dimension: 'ROWS',
          length: rowsToDelete[sheetId],
        },
      });
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests,
        },
      });
    }
  } catch (error) {
    console.error('Error deleting task and related activities:', error);
    throw new Error('Could not delete task data.');
  }
}

export async function deleteActivity(activityId: string): Promise<void> {
  await deleteRowAndAppendBlank(ACTIVITY_SHEET_NAME, activityId);
}
