using System.ComponentModel.DataAnnotations;

namespace ASL.Backend.Models;

public class ASLAlphabet
{
    [Key]
    public string Letter { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public string? VideoUrl { get; set; }

    public string? HandshapeDescription { get; set; }

    public string? ExampleWord { get; set; }

    public string? WordASLVideo { get; set; }
}