using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.InteropServices;

public static class NativeOracleHeadless
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct StartupInfo
    {
        public uint cb; public string reserved; public string desktop; public string title;
        public uint x, y, width, height, charsX, charsY, fill, flags;
        public ushort showWindow, reservedBytes; public IntPtr reservedPointer, stdin, stdout, stderr;
    }
    [StructLayout(LayoutKind.Sequential)]
    private struct ProcessInfo { public IntPtr process, thread; public uint pid, tid; }
    [StructLayout(LayoutKind.Sequential)]
    private struct SecurityAttributes { public int length; public IntPtr descriptor; public int inherit; }
    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr CreateDesktopW(string name, IntPtr device, IntPtr devmode, uint flags, uint access, IntPtr security);
    [DllImport("user32.dll", SetLastError = true)] private static extern bool CloseDesktop(IntPtr desktop);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CreateProcessW(string exe, System.Text.StringBuilder command, IntPtr processAttributes, IntPtr threadAttributes, bool inheritHandles, uint flags, IntPtr environment, string cwd, ref StartupInfo startup, out ProcessInfo process);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr CreateFileW(string file, uint access, uint share, ref SecurityAttributes security, uint creation, uint attributes, IntPtr template);
    [DllImport("kernel32.dll")] private static extern bool CloseHandle(IntPtr handle);
    [DllImport("kernel32.dll", SetLastError = true)] private static extern bool GetExitCodeProcess(IntPtr process, out uint exitCode);
    [DllImport("kernel32.dll", SetLastError = true)] private static extern bool TerminateProcess(IntPtr process, uint exitCode);

    public sealed class Result { public int Pid; public bool TimedOut; public int ExitCode; public string Desktop; }
    public static Result Run(string executable, string commandLine, string directory, string stdout, string stderr, int timeoutMilliseconds, Action<Process, IntPtr> observer = null)
    {
        string desktopName = "CodexNativeOracle_" + Guid.NewGuid().ToString("N");
        IntPtr desktop = CreateDesktopW(desktopName, IntPtr.Zero, IntPtr.Zero, 0, 0x01ff, IntPtr.Zero);
        if (desktop == IntPtr.Zero) throw new Win32Exception(Marshal.GetLastWin32Error(), "Cannot create private desktop; native process was not launched.");
        var security = new SecurityAttributes { length = Marshal.SizeOf<SecurityAttributes>(), inherit = 1 };
        IntPtr output = IntPtr.Zero, error = IntPtr.Zero, input = IntPtr.Zero;
        ProcessInfo created = default(ProcessInfo);
        try
        {
            output = CreateFileW(stdout, 0x40000000, 3, ref security, 2, 0x80, IntPtr.Zero);
            error = CreateFileW(stderr, 0x40000000, 3, ref security, 2, 0x80, IntPtr.Zero);
            input = CreateFileW("NUL", 0x80000000, 3, ref security, 3, 0x80, IntPtr.Zero);
            if (output == new IntPtr(-1) || error == new IntPtr(-1) || input == new IntPtr(-1)) throw new Win32Exception(Marshal.GetLastWin32Error(), "Cannot open native log streams.");
            var startup = new StartupInfo { cb = (uint)Marshal.SizeOf<StartupInfo>(), desktop = desktopName, flags = 0x101, showWindow = 0, stdin = input, stdout = output, stderr = error };
            if (!CreateProcessW(executable, new System.Text.StringBuilder(commandLine), IntPtr.Zero, IntPtr.Zero, true, 0x08000000, IntPtr.Zero, directory, ref startup, out created))
                throw new Win32Exception(Marshal.GetLastWin32Error(), "Cannot launch original native executable on private desktop.");
            using (Process process = Process.GetProcessById((int)created.pid))
            {
                var duration = Stopwatch.StartNew();
                if (observer != null) observer(process, created.process);
                bool completed = process.WaitForExit(Math.Max(0, timeoutMilliseconds - (int)duration.ElapsedMilliseconds));
                if (!completed) { process.Kill(); process.WaitForExit(10000); }
                uint exitCode;
                if (!GetExitCodeProcess(created.process, out exitCode)) throw new Win32Exception(Marshal.GetLastWin32Error(), "Cannot read native process exit status.");
                return new Result { Pid = (int)created.pid, TimedOut = !completed, ExitCode = unchecked((int)exitCode), Desktop = desktopName };
            }
        }
        finally
        {
            // An observer failure must not leave this helper's own child running.
            uint status;
            if (created.process != IntPtr.Zero && GetExitCodeProcess(created.process, out status) && status == 259)
                TerminateProcess(created.process, 0xffffffff);
            foreach (IntPtr handle in new[] { output, error, input, created.process, created.thread })
                if (handle != IntPtr.Zero && handle != new IntPtr(-1)) CloseHandle(handle);
            CloseDesktop(desktop);
        }
    }
}
