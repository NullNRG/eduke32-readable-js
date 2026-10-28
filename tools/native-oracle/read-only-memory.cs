using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;

public static class NativeOracleReadOnlyMemory
{
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool ReadProcessMemory(IntPtr process, IntPtr address, byte[] bytes, UIntPtr size, out UIntPtr read);

    public static byte[] Read(IntPtr process, ulong address, int count)
    {
        if (count <= 0 || count > 1048576) throw new ArgumentOutOfRangeException(nameof(count));
        byte[] bytes = new byte[count];
        UIntPtr read;
        if (!ReadProcessMemory(process, new IntPtr(unchecked((long)address)), bytes, (UIntPtr)count, out read) || read.ToUInt64() != (ulong)count)
            throw new Win32Exception(Marshal.GetLastWin32Error(), "Read-only native memory sample failed at 0x" + address.ToString("x") + " for " + count + " bytes.");
        return bytes;
    }

    public sealed class Frame
    {
        public int Width, Height, Stride, Bpp, Attempts;
        public ulong FramePointer;
        public uint DrawCounterBefore, DrawCounterAfter;
        public bool FramePointerStable;
        public byte[] Pixels, Palette;
    }
    public static Frame CaptureFrame(IntPtr process, ulong moduleBase, Dictionary<string, ulong> rvas, int timeoutMilliseconds)
    {
        var watch = Stopwatch.StartNew();
        int attempts = 0;
        Func<string, int> scalar = name => BitConverter.ToInt32(Read(process, moduleBase + rvas[name], 4), 0);
        Func<string, byte> flag = name => Read(process, moduleBase + rvas[name], 1)[0];
        Func<ulong> pointer = () => BitConverter.ToUInt64(Read(process, moduleBase + rvas["frameplace"], 8), 0);
        while (watch.ElapsedMilliseconds < timeoutMilliseconds)
        {
            attempts++;
            int bpp = scalar("bpp"), width = scalar("xdim"), height = scalar("ydim"), stride = scalar("bytesperline");
            ulong framePointer = pointer();
            if (bpp != 8 || width <= 0 || height <= 0 || width > 4096 || height > 4096 || stride < width || (long)stride * height > 1048576 || framePointer == 0 || flag("offscreenrendering") != 0 || flag("inpreparemirror") != 0 || flag("nogl") == 0)
            { Thread.Sleep(1); continue; }
            uint before = BitConverter.ToUInt32(Read(process, moduleBase + rvas["g_frameCounter"], 4), 0);
            byte[] pixels = Read(process, framePointer, checked(stride * height));
            byte[] palette = Read(process, moduleBase + rvas["curpalettefaded"], 1024);
            uint after = BitConverter.ToUInt32(Read(process, moduleBase + rvas["g_frameCounter"], 4), 0);
            bool stable = pointer() == framePointer && flag("offscreenrendering") == 0 && flag("inpreparemirror") == 0;
            if (!stable) continue;
            return new Frame { Width = width, Height = height, Stride = stride, Bpp = bpp, Attempts = attempts, FramePointer = framePointer, DrawCounterBefore = before, DrawCounterAfter = after, FramePointerStable = stable, Pixels = pixels, Palette = palette };
        }
        throw new TimeoutException("No active original classic software framebuffer was available within the bounded sampling interval.");
    }
}
