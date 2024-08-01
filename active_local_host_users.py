import subprocess
from pathlib import Path
import tkinter as tk
from tkinter import ttk, messagebox, colorchooser
import re
from collections import defaultdict

print("Starting script...")  # Debug statement

# File to store the current user list
CURRENT_USERS = "/tmp/current_users.txt"
PREVIOUS_USERS = "/tmp/previous_users.txt"
LOGFILE = "/tmp/user_log.txt"

# Function to get details of users
def get_user_details():
    print("Getting user details...")  # Debug statement
    user_details = defaultdict(list)

    # Users from `who`
    result = subprocess.run("who -u", shell=True, capture_output=True, text=True)
    for line in result.stdout.strip().split('\n'):
        parts = line.split()
        if len(parts) >= 6:
            user, terminal, _, _, _, pid = parts[:6]
            ip = parts[6] if len(parts) == 7 else "local"
            user_details[user].append({'type': 'interactive', 'ip': ip, 'pid': pid})

    # Users with open network connections
    result = subprocess.run("ss -tpn", shell=True, capture_output=True, text=True)
    for line in result.stdout.strip().split('\n'):
        match = re.search(r'users:\(\("([^"]+)",pid=(\d+),fd=\d+\)\)', line)
        if match:
            comm, pid = match.groups()
            result = subprocess.run(f"ps -p {pid} -o user=", shell=True, capture_output=True, text=True)
            user = result.stdout.strip()
            if user:
                local_ip_port, remote_ip_port = line.split()[4], line.split()[5]
                local_ip, local_port = local_ip_port.split(':')
                remote_ip, remote_port = remote_ip_port.split(':')
                connection_type = 'local network' if local_ip == "127.0.0.1" else 'external network'
                user_details[user].append({
                    'type': connection_type,
                    'local_ip': local_ip,
                    'local_port': local_port,
                    'remote_ip': remote_ip,
                    'remote_port': remote_port,
                    'pid': pid
                })

    # Users with active SSH connections
    result = subprocess.run("ss -tnp | grep sshd", shell=True, capture_output=True, text=True)
    for line in result.stdout.strip().split('\n'):
        match = re.search(r'users:\(\("([^"]+)",pid=(\d+),fd=\d+\)\)', line)
        if match:
            comm, pid = match.groups()
            result = subprocess.run(f"ps -p {pid} -o user=", shell=True, capture_output=True, text=True)
            user = result.stdout.strip()
            if user:
                local_ip_port, remote_ip_port = line.split()[4], line.split()[5]
                local_ip, local_port = local_ip_port.split(':')
                remote_ip, remote_port = remote_ip_port.split(':')
                user_details[user].append({
                    'type': 'ssh',
                    'local_ip': local_ip,
                    'local_port': local_port,
                    'remote_ip': remote_ip,
                    'remote_port': remote_port,
                    'pid': pid
                })

    # Users with active screen or tmux sessions
    result = subprocess.run("ps -eo user,pid,comm | grep -E 'screen|tmux'", shell=True, capture_output=True, text=True)
    for line in result.stdout.strip().split('\n'):
        user, pid, comm = line.split(None, 2)
        if user:
            user_details[user].append({'type': 'screen/tmux', 'ip': 'N/A', 'pid': pid})

    return user_details

# Function to check user login/logout and log changes
def check_users():
    print("Checking users...")  # Debug statement
    user_details = get_user_details()
    current_users = list(user_details.keys())

    with open(CURRENT_USERS, 'w') as f:
        f.write('\n'.join(current_users))

    previous_users = []
    if Path(PREVIOUS_USERS).exists():
        with open(PREVIOUS_USERS, 'r') as f:
            previous_users = f.read().strip().split('\n')

        new_users = set(current_users) - set(previous_users)
        logged_out_users = set(previous_users) - set(current_users)

        if new_users:
            for user in new_users:
                if any(detail['type'] == 'external network' for detail in user_details[user]):
                    message = f"New external login detected: {user}"
                    with open(LOGFILE, 'a') as f:
                        f.write(message + '\n')
                    messagebox.showinfo("New External User", message)

        if logged_out_users:
            message = f"Users logged out: {', '.join(logged_out_users)}"
            with open(LOGFILE, 'a') as f:
                f.write(message + '\n')

    Path(CURRENT_USERS).rename(PREVIOUS_USERS)

    return user_details

# Function to get login history using the 'last' command
def get_login_history(user=None):
    print("Getting login history...")  # Debug statement
    cmd = ["last"]
    if user:
        cmd.append(user)
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout

# Function to update the active users and login history in the GUI
def update_users():
    print("Updating users...")  # Debug statement
    user_details = check_users()
    users_text.config(state=tk.NORMAL)
    users_text.delete(1.0, tk.END)
    
    # Summary
    total_users = len(user_details)
    summary_text = f"Total connected users: {total_users}\n" + "-" * 50 + "\n"
    users_text.insert(tk.END, summary_text)
    
    for user, details_list in user_details.items():
        external_network_count = sum(1 for details in details_list if details['type'] == 'external network')
        local_network_count = sum(1 for details in details_list if details['type'] == 'local network')
        vpn_count = sum(1 for details in details_list if details['type'] == 'vpn')
        screen_tmux_count = sum(1 for details in details_list if details['type'] == 'screen/tmux')
        other_details = [details for details in details_list if details['type'] not in ['external network', 'local network', 'vpn', 'screen/tmux']]
        
        if external_network_count:
            for details in details_list:
                if details['type'] == 'external network':
                    display_text = f"{user} (external network, Local IP: {details['local_ip']}, Local Port: {details['local_port']}, Remote IP: {details['remote_ip']}, Remote Port: {details['remote_port']}, PID: {details['pid']})\n"
                    users_text.insert(tk.END, display_text)
        
        if local_network_count:
            for details in details_list:
                if details['type'] == 'local network':
                    display_text = f"{user} (local network, Local IP: {details['local_ip']}, Local Port: {details['local_port']}, Remote IP: {details['remote_ip']}, Remote Port: {details['remote_port']}, PID: {details['pid']})\n"
                    users_text.insert(tk.END, display_text)
        
        if vpn_count:
            display_text = f"{user} (vpn, connections: {vpn_count}, PIDs: multiple)\n"
            users_text.insert(tk.END, display_text)
        
        if screen_tmux_count:
            display_text = f"{user} (screen/tmux, IP: N/A, sessions: {screen_tmux_count}, PIDs: multiple)\n"
            users_text.insert(tk.END, display_text)
        
        for details in other_details:
            display_text = f"{user} ({details['type']}, IP: {details['ip']}, PID: {details['pid']})\n"
            users_text.insert(tk.END, display_text)
    
    # Add login history
    login_history = get_login_history()
    users_text.insert(tk.END, "\nLogin History:\n" + "-" * 50 + "\n" + login_history)

    users_text.config(state=tk.DISABLED)
    root.after(5000, update_users)  # Update every 5 seconds

# Function to show welcome page
def show_welcome_page():
    print("Showing welcome page...")  # Debug statement
    welcome_window = tk.Toplevel(root)
    welcome_window.title("Welcome")
    welcome_window.geometry("400x200")
    welcome_window.configure(bg='black')
    ttk.Label(welcome_window, text="Welcome to the User Activity Monitor", font=("Arial", 14), background='black', foreground='white').pack(pady=20)
    ttk.Label(welcome_window, text="This tool monitors user login/logout activities and active connections.", wraplength=300, background='black', foreground='white').pack(pady=10)
    ttk.Button(welcome_window, text="Get Started", command=welcome_window.destroy, style="Spy.TButton").pack(pady=10)

# Function to change text color
def change_text_color():
    print("Changing text color...")  # Debug statement
    color = colorchooser.askcolor()[1]
    if color:
        users_text.config(fg=color)

# Function to create tooltips
def create_tooltip(widget, text):
    print("Creating tooltip...")  # Debug statement
    tooltip = tk.Toplevel(widget)
    tooltip.withdraw()
    tooltip.wm_overrideredirect(True)
    tooltip_label = ttk.Label(tooltip, text=text, background="#ffffe0", relief=tk.SOLID, borderwidth=1, wraplength=150)
    tooltip_label.pack()
    
    def show_tooltip(event):
        bbox = widget.bbox("insert")
        if bbox:
            x, y, cx, cy = bbox
        else:
            x, y, cx, cy = 0, 0, 0, 0
        x += widget.winfo_rootx() + 25
        y += widget.winfo_rooty() + 25
        tooltip.wm_geometry("+%d+%d" % (x, y))
        tooltip.deiconify()

    def hide_tooltip(event):
        tooltip.withdraw()

    widget.bind("<Enter>", show_tooltip)
    widget.bind("<Leave>", hide_tooltip)

# Setting up the GUI
print("Setting up the GUI...")  # Debug statement
root = tk.Tk()
root.title("Active Users")
root.configure(bg='black')

# Set the window size and remove the default window decorations for a spy tool look
root.geometry("800x600")
root.overrideredirect(True)

# Create menu for options
menu = tk.Menu(root, bg='black', fg='white')
root.config(menu=menu)
options_menu = tk.Menu(menu, tearoff=0, bg='black', fg='white')
menu.add_cascade(label="Options", menu=options_menu)
options_menu.add_command(label="Change Text Color", command=change_text_color)

# Configure styles for buttons and labels
style = ttk.Style()
style.configure("TLabel", background='black', foreground='white')
style.configure("Spy.TButton", background='black', foreground='white', borderwidth=0)
style.map("Spy.TButton", background=[('active', 'grey')])

mainframe = ttk.Frame(root, padding="10", style="TFrame")
mainframe.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
mainframe.grid_columnconfigure(0, weight=1)
mainframe.grid_rowconfigure(1, weight=1)

ttk.Label(mainframe, text="Active Users:", style="TLabel").grid(row=0, column=0, sticky=tk.W)

# Add a horizontal scrollbar
scrollbar_x = tk.Scrollbar(mainframe, orient="horizontal", bg='black')
scrollbar_x.grid(row=2, column=0, sticky=(tk.W, tk.E))

# Add a vertical scrollbar
scrollbar_y = tk.Scrollbar(mainframe, orient="vertical", bg='black')
scrollbar_y.grid(row=1, column=1, sticky=(tk.N, tk.S))

# Use Text widget instead of Listbox for text selection
users_text = tk.Text(mainframe, wrap="none", xscrollcommand=scrollbar_x.set, yscrollcommand=scrollbar_y.set, bg='black', fg='white', insertbackground='white')
users_text.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
scrollbar_x.config(command=users_text.xview)
scrollbar_y.config(command=users_text.yview)

# Create tooltip for users_text
create_tooltip(users_text, "This text box displays user activity and login history.")

print("Starting GUI loop...")  # Debug statement
root.after(0, show_welcome_page)
root.after(0, update_users)
root.mainloop()

