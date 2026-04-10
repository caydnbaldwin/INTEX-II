using System.Reflection;
using Backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Backend.Tests.Unit;

public class MigrationsCoverageTests
{
    private static readonly Assembly BackendAssembly = typeof(AppDbContext).Assembly;

    public static IEnumerable<object[]> MigrationTypes()
    {
        return BackendAssembly
            .GetTypes()
            .Where(type =>
                typeof(Migration).IsAssignableFrom(type)
                && type.Namespace == "Backend.Migrations"
                && !type.IsAbstract)
            .OrderBy(type => type.Name)
            .Select(type => new object[] { type });
    }

    public static IEnumerable<object[]> ModelSnapshotTypes()
    {
        return BackendAssembly
            .GetTypes()
            .Where(type =>
                typeof(ModelSnapshot).IsAssignableFrom(type)
                && type.Namespace == "Backend.Migrations"
                && !type.IsAbstract)
            .OrderBy(type => type.Name)
            .Select(type => new object[] { type });
    }

    [Fact]
    public void MigrationTypes_AreDiscovered()
    {
        Assert.NotEmpty(MigrationTypes());
    }

    [Theory]
    [MemberData(nameof(MigrationTypes))]
    public void MigrationMethods_RunWithoutException(Type migrationType)
    {
        var migration = (Migration)Activator.CreateInstance(migrationType)!;

        InvokeNonPublicMethod(migrationType, migration, "Up", new MigrationBuilder("Microsoft.EntityFrameworkCore.SqlServer"));
        InvokeNonPublicMethod(migrationType, migration, "Down", new MigrationBuilder("Microsoft.EntityFrameworkCore.SqlServer"));

        var buildTargetModel = migrationType.GetMethod("BuildTargetModel", BindingFlags.Instance | BindingFlags.NonPublic);
        if (buildTargetModel is not null)
        {
            var modelBuilder = new ModelBuilder(new ConventionSet());
            buildTargetModel.Invoke(migration, new object[] { modelBuilder });
            Assert.NotNull(modelBuilder.Model);
        }
    }

    [Fact]
    public void ModelSnapshotTypes_AreDiscovered()
    {
        Assert.NotEmpty(ModelSnapshotTypes());
    }

    [Theory]
    [MemberData(nameof(ModelSnapshotTypes))]
    public void ModelSnapshot_BuildModel_RunsWithoutException(Type snapshotType)
    {
        var snapshot = (ModelSnapshot)Activator.CreateInstance(snapshotType)!;
        var modelBuilder = new ModelBuilder(new ConventionSet());

        InvokeNonPublicMethod(snapshotType, snapshot, "BuildModel", modelBuilder);

        Assert.NotEmpty(modelBuilder.Model.GetEntityTypes());
    }

    private static void InvokeNonPublicMethod(Type targetType, object instance, string methodName, object argument)
    {
        var method = targetType.GetMethod(methodName, BindingFlags.Instance | BindingFlags.NonPublic);
        Assert.NotNull(method);
        method!.Invoke(instance, new[] { argument });
    }
}